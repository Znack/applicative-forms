import { Option, none, some } from 'fp-ts/lib/Option';
import { Either, right, map as mapEither, left } from 'fp-ts/lib/Either';
import { type } from 'io-ts';
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

interface FieldState<A> {
  raw: string;
  value: Option<A>;
  validator: Validator<A>;
  errors: FormError[];
  status: FieldStatus;
}

const composeFieldStatus = (statusFirst: FieldStatus, statusSecond: FieldStatus): FieldStatus =>
  max(ordFieldStatus)(statusFirst, statusSecond);
const composeFieldStatuses = (...statuses: FieldStatus[]): FieldStatus => statuses.reduce(max(ordFieldStatus));

interface FormState {
  isSubmitted: boolean;
  fields: Map<Form<unknown>, FieldState<unknown>>;
}

export interface Form<A> {
  map: <B>(f: (a: A) => B) => Form<B>;
  ap: <B>(fab: Form<(a: A) => B>) => Form<B>;
  addField: A extends (arg: infer Arg) => infer Result ? (fab: Form<Arg>) => Form<Result> : never;
  state: { type: 'field'; fieldState: FieldState<A> } | { type: 'form'; formState: FormState };
}

const boundMap = function<A, B>(this: Form<A>, f: (a: A) => B): Form<B> {
  return map(this, f);
};
const boundAp = function<A, B>(this: Form<A>, fab: Form<(a: A) => B>): Form<B> {
  return ap(fab, this);
};
const isFunctionForm = <A, R>(x: Form<any>): x is Form<(arg: A) => R> =>
  x.state.type === 'field' &&
  (x.state.fieldState.value.isNone() ||
    (x.state.fieldState.value.isSome() && typeof x.state.fieldState.value.value === 'function'));
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
    formState: { isSubmitted: false, fields: new Map() },
  },
});
const createField = <A>(a: Option<A>, validator: Validator<A>): Form<A> => ({
  ...commonMethods,
  state: {
    type: 'field',
    fieldState: { raw: '', value: a, validator, errors: [], status: 'pristine' },
  },
});
const setFieldState = <A>(fieldState: FieldState<A>): Form<A> => ({
  ...commonMethods,
  state: {
    type: 'field',
    fieldState,
  },
});
const setFieldRaw = <A>(fieldState: FieldState<A>, raw: string): Form<A> => ({
  ...commonMethods,
  state: {
    type: 'field',
    fieldState: { raw, ...fieldState },
  },
});

export const applicativeForm = {
  map: <A, B>(fa: Form<A>, f: (a: A) => B): Form<B> => ({
    ...commonMethods,
    state:
      fa.state.type === 'field'
        ? {
            type: 'field',
            fieldState: {
              raw: '',
              value: fa.state.fieldState.value.map(f),
              validator: compose(
                mapEither(f),
                fa.state.fieldState.validator,
              ),
              errors: [],
              status: fa.state.fieldState.status,
            },
          }
        : fa.state,
  }),
  of: <A>(a: A): Form<A> => createField(some(a), constant(right(a))),
  ap: <A, B>(fab: Form<(a: A) => B>, fa: Form<A>): Form<B> => ({
    ...commonMethods,
    state:
      fa.state.type === 'field'
        ? {
            type: 'field',
            fieldState: {
              raw: '',
              value: fa.state.fieldState.value.ap(fab.state.type === 'field' ? fab.state.fieldState.value : none),
              validator: raw => {
                const first: Either<FormError[], A> =
                  fa.state.type === 'field' ? fa.state.fieldState.validator(raw) : left([]);
                const second: Either<FormError[], (a: A) => B> =
                  fab.state.type === 'field' ? fab.state.fieldState.validator(raw) : left([]);
                return first.ap(second);
              },
              errors: [],
              status:
                fab.state.type === 'field'
                  ? composeFieldStatus(fab.state.fieldState.status, fa.state.fieldState.status)
                  : fa.state.fieldState.status,
            },
          }
        : {
            type: 'form',
            formState: {
              isSubmitted:
                fa.state.formState.isSubmitted || (fab.state.type === 'form' && fab.state.formState.isSubmitted),
              fields:
                fab.state.type === 'form'
                  ? ((fab.state.formState.fields.forEach((field, key) =>
                      (fa.state as { type: 'form'; formState: FormState }).formState.fields.set(key, field),
                    ) as unknown) as false) || fa.state.formState.fields
                  : fa.state.formState.fields.set(fab, fab.state.fieldState),
            },
          },
  }),
};

export const map = applicativeForm.map;
export const of = applicativeForm.of;
export const ap = applicativeForm.ap;

export const initial = <A>(value: A): Form<A> => applicativeForm.of(value);
export const empty = <A>(): Form<A> =>
  createField(none, constant(left([{ code: 'validatorNotDefined', description: 'Define validator for this field' }])));

export const textField = (): Form<string> => empty();
export const optionalTextField = (): Form<Option<string>> => empty();
export const intField = (): Form<number> => empty();
export const withInitial = <A>(initialValue: A, form: Form<A>): Form<A> => ({
  map: form.map,
  ap: form.ap,
  addField: form.addField,
  state:
    form.state.type === 'field'
      ? {
          type: 'field',
          fieldState: { value: some(initialValue), ...form.state.fieldState },
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
          fieldState: { validator: validate, ...form.state.fieldState },
        }
      : form.state,
});

export type UpdateError = { error: 'unknownField' } | { error: 'formIsPrimitive' };

export const getFieldValue = <A, B>(form: Form<A>, field: Form<B>): Option<Form<B>> =>
  form.state.type === 'field'
    ? none
    : form.state.formState.fields.has(field)
    ? some(setFieldState(form.state.formState.fields.get(field) as FieldState<B>))
    : none;
export const updateField = <A, B>(form: Form<A>, field: Form<B>, raw: string): Either<UpdateError, Form<A>> => {
  if (form.state.type === 'field') {
    return left({ error: 'formIsPrimitive' });
  }
  const formField = form.state.formState.fields.get(field);
  if (!formField) {
    return left({ error: 'unknownField' });
  }
  const validated = formField.validator(raw);
  const newState = {
    raw,
    value: validated.map(some).getOrElse(none),
    errors: validated.isLeft() ? validated.value : [],
    ...(formField as FieldState<B>),
  };
  form.state.formState.fields.set(field, newState);
  return right(form);
};

export const getErrors = (form: Form<unknown>): FormError[] =>
  form.state.type === 'form' ? [] : form.state.fieldState.errors;
export const hasErrors = <A>(form: Form<A>): boolean => getErrors(form).length > 0;
export const isPristine = <A>(form: Form<A>): boolean =>
  form.state.type === 'field'
    ? form.state.fieldState.status === 'pristine'
    : composeFieldStatuses(...Array.from(form.state.formState.fields.values()).map(x => x.status)) === 'pristine';
export const getValidated = <A>(form: Form<A>): Option<A> =>
  form.state.type === 'field' ? form.state.fieldState.value : none;
export const getRawValue = <A>(form: Form<A>): string => (form.state.type === 'field' ? form.state.fieldState.raw : '');
export const getOrElse = <A>(defaultValue: A, form: Form<A>): A => getValidated(form).getOrElse(defaultValue);
export const projectValid = <A, B>(defaultValue: B, projection: (a: A) => B, form: Form<A>): B =>
  getValidated(form.map(projection)).getOrElse(defaultValue);
