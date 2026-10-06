import type { CanonicalQuestion } from "@/lib/canonicalAssessment";

export interface QuestionCardProps {
  question: CanonicalQuestion;
  defaultValue?: string | number | string[];
}

function selectedValues(defaultValue: QuestionCardProps["defaultValue"]): string[] {
  if (Array.isArray(defaultValue)) return defaultValue.map(String);
  if (defaultValue === undefined || defaultValue === null) return [];
  return [String(defaultValue)];
}

export default function QuestionCard({ question, defaultValue }: QuestionCardProps) {
  const selected = selectedValues(defaultValue);
  const scalarDefault = Array.isArray(defaultValue) ? undefined : defaultValue;

  if (question.type === "free_text") {
    return <label className="canonical-question"><span>{question.text}</span><textarea name={question.id} maxLength={question.max ?? 1000} defaultValue={scalarDefault?.toString()} required={question.required} placeholder="Optional context" /></label>;
  }

  // decimal_with_unit: a numeric value plus the canonical unit option set.
  if (question.type === "decimal_with_unit") {
    const units = question.options ?? [];
    const parsed = typeof defaultValue === "string" ? JSON.parse(defaultValue) as { value?: number; unit?: string } : undefined;
    return (
      <fieldset className="canonical-question">
        <legend>{question.text}</legend>
        {question.helpText && <small>{question.helpText}</small>}
        <input name={`${question.id}__value`} type="number" min={question.min} max={question.max} step="any" defaultValue={parsed?.value?.toString()} required={question.required} />
        <div className="canonical-options">
          {units.map((unit) => (
            <label key={unit.id}><input type="radio" name={`${question.id}__unit`} value={unit.id} defaultChecked={parsed?.unit === unit.id} required={question.required} /><span>{unit.label}</span></label>
          ))}
        </div>
      </fieldset>
    );
  }

  if (["integer", "decimal", "integer_scale"].includes(question.type)) {
    return <label className="canonical-question"><span>{question.text}</span><input name={question.id} type="number" min={question.min} max={question.max} step={question.type === "decimal" ? "any" : 1} defaultValue={defaultValue?.toString()} required={question.required} />{question.helpText && <small>{question.helpText}</small>}</label>;
  }

  const options = question.options ?? [];
  if (question.type === "multi_select") {
    return <fieldset className="canonical-question"><legend>{question.text}</legend>{question.helpText && <small>{question.helpText}</small>}<div className="canonical-options">{options.map((option) => <label key={option.id}><input type="checkbox" name={question.id} value={option.id} defaultChecked={selected.includes(option.id)} data-exclusive={option.exclusive || option.isNa ? "true" : undefined} /><span>{option.label}</span></label>)}</div></fieldset>;
  }
  return <fieldset className="canonical-question"><legend>{question.text}</legend>{question.helpText && <small>{question.helpText}</small>}<div className="canonical-options">{options.map((option) => <label key={option.id}><input type="radio" name={question.id} value={option.id} defaultChecked={selected.includes(option.id)} required={question.required} /><span>{option.label}</span></label>)}</div></fieldset>;
}
