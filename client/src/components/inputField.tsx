import { useField } from "formik";
import React, { InputHTMLAttributes } from "react";
import {
  FormControl,
  FormErrorMessage,
  FormLabel,
} from "@chakra-ui/form-control";
import { Input, InputProps } from "@chakra-ui/input";
import { Textarea, TextareaProps } from "@chakra-ui/textarea";
import { ComponentWithAs } from "@chakra-ui/system";

type inputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  textarea?: boolean;
};
// type inputFieldProps = [FieldInputProps<any>, FieldMetaProps<any>, FieldHelperProps<any>]

export const InputField: React.FC<inputFieldProps> = ({
  label,
  textarea,
  size: _,
  ...props
}) => {
  let C: any = Input;
  if (textarea) {
    C = Textarea;
  }
  const [field, { error }] = useField(props);
  return (
    <FormControl isInvalid={!!error}>
      <FormLabel htmlFor={field.name}>{label}</FormLabel>
      <C {...props} {...field} id={field.name} />
      {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}
    </FormControl>
  );
};
