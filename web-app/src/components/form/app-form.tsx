import { createFormHook, createFormHookContexts } from "@tanstack/react-form"
import {
  FormTextField,
  FormTextPasswordField
} from "./components/form-text-field"

export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts()

export const { useAppForm, withForm, withFieldGroup } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    InputField: FormTextField,
    PasswordField: FormTextPasswordField
  },
  formComponents: {}
})
