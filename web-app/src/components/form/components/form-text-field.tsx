import { Input } from "@/components/ui/input"
import { useFieldContext } from "../app-form"
import { FormBase, type FormControlProps } from "./form-base"

export function FormTextField(props: FormControlProps) {
  const field = useFieldContext<string>()
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
  return (
    <FormBase {...props}>
      <Input
        id={field.name}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) =>{  field.handleChange(e.target.value); }}
        aria-invalid={isInvalid}
      />
    </FormBase>
  )
}

export function FormTextPasswordField(props: FormControlProps) {
  const field = useFieldContext<string>()
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
  return (
    <FormBase {...props}>
      <Input
        type="password"
        id={field.name}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) =>{  field.handleChange(e.target.value); }}
        aria-invalid={isInvalid}
      />
    </FormBase>
  )
}
