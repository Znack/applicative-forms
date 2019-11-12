import { Option, none, some } from 'fp-ts/lib/Option';
import { Either, right, map as mapEither, left } from 'fp-ts/lib/Either';
import { constant, compose } from 'fp-ts/lib/function';
import { setoidString } from 'fp-ts/lib/Setoid';
import { Ord, max } from 'fp-ts/lib/Ord';
import { Ordering } from 'fp-ts/lib/Ordering';

export type FormError = {
  code: string;
  description: string;
};

export type Validator<A> = (raw: string) => Either<Array<FormError>, A>;

type FieldStatus = 'pristine' | 'dirty' | 'validated';

export const ordFieldStatus: Ord<FieldStatus> = {
  ...setoidString,
  compare: (x: FieldStatus, y: FieldStatus): Ordering => {
    const statusWeight = {
      dirty: 2,
      validated: 1,
      pristine: 0,
    };
    return statusWeight[x] < statusWeight[y] ? -1 : statusWeight[x] > statusWeight[y] ? 1 : 0;
  },
};
const composeFieldStatuses = (...statuses: FieldStatus[]): FieldStatus => statuses.reduce(max(ordFieldStatus));

interface FieldState<A> {
  type: 'field';
  raw: string;
  value: Option<A>;
  validator: Validator<A>;
  errors: FormError[];
  status: FieldStatus;
}

interface FormState<A> {
  type: 'form';
  isSubmitted: boolean;
  fields: Map<Form<unknown>, FieldState<unknown>>;
  value: Option<A>;
}

export interface Form<A> {
  map: <B>(f: (a: A) => B) => Form<B>;
  ap: <B>(fab: Form<(a: A) => B>) => Form<B>;
  addField: A extends (arg: infer Arg) => infer Result ? (fab: Form<Arg>) => Form<Result> : never;
  state: FieldState<A> | FormState<A>;
}

const boundMap = function<A, B>(this: Form<A>, f: (a: A) => B): Form<B> {
  return map(this, f);
};
const boundAp = function<A, B>(this: Form<A>, fab: Form<(a: A) => B>): Form<B> {
  return ap(fab, this);
};
const isFunctionForm = <A, R>(x: Form<any>): x is Form<(arg: A) => R> => true; // TODO maybe we have to check it, but TS is enough for now
const boundAddField = function<B, R, A extends (x: B) => R>(this: Form<A>, fa: Form<B>): Form<R> {
  if (isFunctionForm<B, R>(this)) {
    return ap(this, fa);
  }
  throw new Error('Invalid addField invocation, this should contain a function');
};

const commonMethods = { map: boundMap, ap: boundAp, addField: boundAddField as any };

export const form = <A, R>(constructor: (x: A) => R): Form<(x: A) => R> => ({
  ...commonMethods,
  state: {
    type: 'form',
    isSubmitted: false,
    fields: new Map(),
    value: some(constructor),
  },
});
const createField = <A>(a: Option<A>, validator: Validator<A>): Form<A> => ({
  ...commonMethods,
  state: {
    type: 'field',
    raw: '',
    value: a,
    validator,
    errors: [],
    status: 'pristine',
  },
});
const setFieldState = <A>(fieldState: FieldState<A>): Form<A> => ({
  ...commonMethods,
  state: {
    type: 'field',
    ...fieldState,
  },
});
const setFieldRaw = <A>(fieldState: FieldState<A>, raw: string): Form<A> => ({
  ...commonMethods,
  state: {
    type: 'field',
    raw,
    ...fieldState,
  },
});

export const applicativeForm = {
  map: <A, B>(fa: Form<A>, f: (a: A) => B): Form<B> => ({
    ...commonMethods,
    state:
      fa.state.type === 'field'
        ? {
            type: 'field',
            raw: '',
            value: fa.state.value.map(f),
            validator: compose(
              mapEither(f),
              fa.state.validator,
            ),
            errors: [],
            status: fa.state.status,
          }
        : {
            type: 'form',
            value: fa.state.value.map(f),
            fields: fa.state.fields,
            isSubmitted: fa.state.isSubmitted,
          },
  }),
  of: <A>(a: A): Form<A> => createField(some(a), constant(right(a))),
  ap: <A, B>(fab: Form<(a: A) => B>, fa: Form<A>): Form<B> => ({
    ...commonMethods,
    state:
      fa.state.type === 'field' && fab.state.type === 'field'
        ? {
            type: 'field',
            raw: '',
            value: fa.state.value.ap(fab.state.value),
            validator: raw => {
              const first: Either<FormError[], A> = (fa.state as FieldState<A>).validator(raw);
              const second: Either<FormError[], (a: A) => B> = (fab.state as FieldState<(a: A) => B>).validator(raw);
              return first.ap(second);
            },
            errors: [],
            status: composeFieldStatuses(fab.state.status, fa.state.status),
          }
        : {
            type: 'form',
            isSubmitted:
              (fa.state.type === 'form' && fa.state.isSubmitted) ||
              (fab.state.type === 'form' && fab.state.isSubmitted),
            value: fa.state.value.ap(fab.state.value),
            fields:
              fa.state.type === 'form'
                ? fab.state.type === 'form'
                  ? ((fa.state.fields.forEach((field, key) =>
                      (fab.state as FormState<unknown>).fields.set(key, field),
                    ) as unknown) as false) || fab.state.fields
                  : fa.state.fields.set(fab, fab.state)
                : fab.state.type === 'form'
                ? fab.state.fields.set(fa, fa.state)
                : new Map(),
          },
  }),
};

export const map = applicativeForm.map;
export const of = applicativeForm.of;
export const ap = applicativeForm.ap;

// Field primitives
export const initial = <A>(value: A): Form<A> => applicativeForm.of(value);

export const empty = <A>(validate: Validator<A>): Form<A> => createField(none, validate);

export const textField = (): Form<string> => empty(right);

export const optionalTextField = (): Form<Option<string>> => empty(x => right(some(x)));

export const intField = (): Form<number> => empty(intValidator);

// Field combinators
export const withInitial = <A>(initialValue: A, form: Form<A>): Form<A> => ({
  map: form.map,
  ap: form.ap,
  addField: form.addField,
  state:
    form.state.type === 'field'
      ? {
          type: 'field',
          value: some(initialValue),
          ...form.state,
        }
      : form.state,
});

export const withValidator = <A>(validate: Validator<A>, form: Form<A>): Form<A> => ({
  map: form.map,
  ap: form.ap,
  addField: form.addField,
  state:
    form.state.type === 'field'
      ? {
          type: 'field',
          validator: validate,
          ...form.state,
        }
      : form.state,
});

// Find and update fields in forms
export const getFieldValue = <A, B>(form: Form<A>, field: Form<B>): Option<Form<B>> =>
  form.state.type === 'field'
    ? none
    : form.state.fields.has(field)
    ? some(setFieldState(form.state.fields.get(field) as FieldState<B>))
    : none;

export type UpdateError = { error: 'unknownField' } | { error: 'formIsPrimitive' };

export const updateField = <A, B>(form: Form<A>, field: Form<B>, raw: string): Either<UpdateError, Form<A>> => {
  if (form.state.type === 'field') {
    return left({ error: 'formIsPrimitive' });
  }
  const fieldState = form.state.fields.get(field) as FieldState<B> | undefined;
  if (!fieldState) {
    return left({ error: 'unknownField' });
  }
  const validated = fieldState.validator(raw);
  const newState: FieldState<B> = {
    type: 'field',
    status: validated.isLeft() ? 'dirty' : 'validated',
    raw,
    value: validated.map(some).getOrElse(fieldState.value),
    errors: validated.isLeft() ? validated.value : [],
    validator: fieldState.validator,
  };
  const fields = form.state.fields.set(field, newState);
  return right({ fields, ...form });
};

// Selectors
export const getErrors = (form: Form<unknown>): FormError[] => (form.state.type === 'form' ? [] : form.state.errors);

export const hasErrors = <A>(form: Form<A>): boolean => getErrors(form).length > 0;

export const isPristine = <A>(form: Form<A>): boolean =>
  form.state.type === 'field'
    ? form.state.status === 'pristine'
    : composeFieldStatuses(...Array.from(form.state.fields.values()).map(x => x.status)) === 'pristine';

export const getValidated = <A>(form: Form<A>): Option<A> =>
  form.state.type === 'field' ? form.state.value : form.state.value;

export const getRawValue = <A>(form: Form<A>): string => (form.state.type === 'field' ? form.state.raw : '');

export const getOrElse = <A>(defaultValue: A, form: Form<A>): A => getValidated(form).getOrElse(defaultValue);

export const projectValid = <A, B>(defaultValue: B, projection: (a: A) => B, form: Form<A>): B =>
  getValidated(form.map(projection)).getOrElse(defaultValue);

// validators
export const intValidator = (raw: string): Either<FormError[], number> =>
  isNaN(+raw)
    ? left([{ code: 'invalidNumber', description: 'Invalid number format, please use digits and negate sign only' }])
    : right(Number(raw));

export const minLengthStringValidator = (minLength: number) => (raw: string): Either<FormError[], string> =>
  raw.length < minLength
    ? left([{ code: 'invalidLength', description: `Minimum string length ${minLength} symbols is required` }])
    : right(raw);
