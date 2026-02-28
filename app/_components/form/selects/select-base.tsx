"use client";

import { Form, FormInstance, RefSelectProps, Select, SelectProps } from "antd";
import { focusNext } from "../../../_utils/autofocus";
import { forwardRef, useImperativeHandle, useState } from "react";
import { FormItemProps } from "antd/lib";
import React from "react";

export interface RefSelectBaseProps extends RefSelectProps {
  changeValue: (value: unknown) => void;
}

export interface SelectBaseProps extends SelectProps {
  nextInEnter?: boolean;
  nextWithPrevent?: boolean;
  formWithMessage?: boolean;
  uppercase?: boolean;
  propsForm?: FormItemProps & {
    prefix_array_name?: (string | number)[];
  };
  form?: FormInstance;
}

function Base({
  nextInEnter,
  nextWithPrevent,
  onKeyUp,
  onOpenChange,
  innerRef,
  uppercase = false,
  onSearch,
  showSearch,
  ...props
}: SelectBaseProps & { innerRef?: React.Ref<any> }) {
  const [open, setOpen] = useState(false);

  // Si se proporciona onSearch, automáticamente habilitar showSearch
  const shouldShowSearch = showSearch !== undefined ? showSearch : !!onSearch;

  return (
    <Select
      ref={innerRef}
      {...props}
      showSearch={shouldShowSearch}
      onSearch={onSearch ? (value) => {
        if (uppercase && value) {
          const uppercased = value.toUpperCase();
          onSearch?.(uppercased);
        } else {
          onSearch?.(value);
        }
      } : undefined}
      onOpenChange={(open) => {
        setOpen(open);
        onOpenChange?.(open);
      }}
      onKeyUp={(e) => {
        if (e.key === "Enter" && nextInEnter) {
          if (!open) return;
          if (nextWithPrevent) e.preventDefault();
          focusNext();
        }
        onKeyUp?.(e);
      }}
    />
  );
}

const SelectBase = forwardRef<RefSelectBaseProps, SelectBaseProps>(function SelectBase({
  nextInEnter = true,
  nextWithPrevent = true,
  onKeyUp,
  onOpenChange,
  formWithMessage = true,
  propsForm,
  onChange,
  form,
  optionFilterProp = "label",
  variant = "filled",
  uppercase = false,
  onSearch,
  showSearch,
  ...props
}, ref) {
  const {
    hasFeedback = true,
    className = "w-full",
    ...propsFormItem
  } = propsForm || {};

  const [value, setValue] = useState<unknown>();
  const selectRef = React.useRef<any>(null);

  useImperativeHandle(
    ref,
    () => ({
      changeValue: (value: unknown) => {
        if (form && propsFormItem.name) {
          form.setFieldValue(
            propsFormItem.name instanceof Array
              ? [
                  ...(propsFormItem.prefix_array_name ?? []),
                  ...propsFormItem.name,
                ]
              : propsFormItem.name,
            value
          );
        } else {
          setValue(value);
        }
      },
      focus: () => {
        selectRef.current?.focus();
      },
      blur: () => {
        selectRef.current?.blur();
      },
      scrollTo: (arg?: any) => {
        selectRef.current?.scrollTo?.(arg);
      },
      nativeElement: selectRef.current?.nativeElement,
    }),
    [form, propsFormItem.name, propsFormItem.prefix_array_name, setValue]
  );

  return propsForm ? (
    <Form.Item
      hasFeedback={hasFeedback}
      {...propsFormItem}
      className={`${className} ${formWithMessage ? "" : "!mb-0"}`}
    >
      <Base
        innerRef={selectRef}
        nextInEnter={nextInEnter}
        nextWithPrevent={nextWithPrevent}
        onKeyUp={onKeyUp}
        onOpenChange={onOpenChange}
        onChange={onChange}
        optionFilterProp={optionFilterProp}
        variant={variant}
        uppercase={uppercase}
        onSearch={onSearch}
        showSearch={showSearch}
        {...props}
      />
    </Form.Item>
  ) : (
    <Base
      innerRef={selectRef}
      nextInEnter={nextInEnter}
      nextWithPrevent={nextWithPrevent}
      onKeyUp={onKeyUp}
      onOpenChange={onOpenChange}
      onChange={(value) => {
        setValue(value);
        onChange?.(value);
      }}
      value={value}
      optionFilterProp={optionFilterProp}
      variant={variant}
      uppercase={uppercase}
      onSearch={onSearch}
      showSearch={showSearch}
      {...props}
    />
  );
});

export default SelectBase;
