// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from "react";
import { Input } from "@chakra-ui/react";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export interface DatePickerProps {
  selectedDate: string | null;
  onChange: (date: string | null) => void;
  placeholderText?: string;
}

export const DatePicker = ({
  selectedDate,
  onChange,
  placeholderText,
}: DatePickerProps) => {
  return (
    <ReactDatePicker
      selected={selectedDate ? new Date(selectedDate) : null}
      onChange={(date) =>
        onChange(date ? date.toISOString().split("T")[0] : null)
      }
      dateFormat="yyyy-MM-dd"
      placeholderText={placeholderText}
      customInput={<Input />}
    />
  );
};
