import { useField } from "formik";
import React, { InputHTMLAttributes } from "react";
import {
  FormControl,
  FormErrorMessage,
  FormLabel,
} from "@chakra-ui/form-control";
import { Input } from "@chakra-ui/input";

type inputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  // placeholder: string;
};
// type inputFieldProps = [FieldInputProps<any>, FieldMetaProps<any>, FieldHelperProps<any>]

export const InputField: React.FC<inputFieldProps> = ({
  label,
  size: _,
  ...props
}) => {
  const [field, { error }] = useField(props);
  return (
    <FormControl isInvalid={!!error}>
      <FormLabel htmlFor={field.name}>{label}</FormLabel>
      <Input {...props} {...field} id={field.name} />
      {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}
    </FormControl>
  );
};
