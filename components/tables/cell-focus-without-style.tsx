export default function CellFocusWithoutStyle() {
  return (
    <style>
      {`.ag-cell-focus {
                border: none !important;
                outline: none !important;
                box-shadow: none !important;
            }`}
    </style>
  )
}
