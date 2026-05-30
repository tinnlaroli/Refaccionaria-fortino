import { useCallback, useMemo, useState } from "react";
import type { FieldErrors, Validator } from "../lib/validation.js";
import { validateFields } from "../lib/validation.js";

type Rules<T extends string> = Partial<Record<T, Validator>>;

export function useFormValidation<T extends string>(
  initial: Record<T, unknown>,
  rules: Rules<T>,
) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<FieldErrors<T>>({});
  const [touched, setTouched] = useState<Partial<Record<T, boolean>>>({});

  const setField = useCallback(
    <K extends T>(field: K, value: Record<T, unknown>[K]) => {
      setValues((prev) => ({ ...prev, [field]: value }));
      if (touched[field] && rules[field]) {
        const msg = rules[field]!(value as never);
        setErrors((prev) => {
          const next = { ...prev };
          if (msg) next[field] = msg;
          else delete next[field];
          return next;
        });
      }
    },
    [rules, touched],
  );

  const touch = useCallback(
    (field: T) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      if (rules[field]) {
        const msg = rules[field]!(values[field] as never);
        setErrors((prev) => {
          const next = { ...prev };
          if (msg) next[field] = msg;
          else delete next[field];
          return next;
        });
      }
    },
    [rules, values],
  );

  const validateAll = useCallback(() => {
    const next = validateFields(values, rules);
    setErrors(next);
    setTouched(
      Object.keys(rules).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {} as Partial<Record<T, boolean>>,
      ),
    );
    return Object.keys(next).length === 0;
  }, [rules, values]);

  const reset = useCallback(
    (nextValues?: Record<T, unknown>) => {
      setValues(nextValues ?? initial);
      setErrors({});
      setTouched({});
    },
    [initial],
  );

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  const fieldInvalid = useCallback(
    (field: T) => Boolean(touched[field] && errors[field]),
    [errors, touched],
  );

  return {
    values,
    errors,
    touched,
    setField,
    touch,
    validateAll,
    reset,
    isValid,
    fieldInvalid,
    setValues,
    setErrors,
  };
}
