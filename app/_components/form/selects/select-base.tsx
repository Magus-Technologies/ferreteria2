"use client";

import { Form, FormInstance, RefSelectProps, Select, SelectProps } from "antd";
import { focusNext } from "../../../_utils/autofocus";
import { RefObject, useImperativeHandle, useState } from "react";
import { FormItemProps } from "antd/lib";

export interface RefSelectBaseProps extends RefSelectProps {
  changeValue: (value: unknown) => void;
}

export interface SelectBaseProps extends SelectProps {
  nextInEnter?: boolean;
  nextWithPrevent?: boolean;
  formWithMessage?: boolean;
  propsForm?: FormItemProps & {
    prefix_array_name?: (string | number)[];
  };
  ref?: RefObject<RefSelectBaseProps | null>;
  form?: FormInstance;
}

function Base({
  nextInEnter,
  nextWithPrevent,
  onKeyUp,
  onOpenChange,
  ...props
}: SelectBaseProps) {
  const [open, setOpen] = useState(false);

  return (
    <Select
      {...props}
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

export default function SelectBase({
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
  ...props
}: SelectBaseProps) {
  const {
    hasFeedback = true,
    className = "w-full",
    ...propsFormItem
  } = propsForm || {};

  const [value, setValue] = useState<unknown>();

  useImperativeHandle(
    props.ref,
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
        // Implementación básica de focus
      },
      blur: () => {
        // Implementación básica de blur
      },
      scrollTo: () => {
        // Implementación básica de scrollTo
      },
      nativeElement: undefined as unknown as HTMLElement,
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
        nextInEnter={nextInEnter}
        nextWithPrevent={nextWithPrevent}
        onKeyUp={onKeyUp}
        onOpenChange={onOpenChange}
        onChange={onChange}
        optionFilterProp={optionFilterProp}
        variant={variant}
        {...props}
      />
    </Form.Item>
  ) : (
    <Base
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
      {...props}
    />
  );
}
