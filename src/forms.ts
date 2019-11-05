import { Option } from 'fp-ts/lib/Option';
import { Either, right } from 'fp-ts/lib/Either';

export interface Form<A> {
  map: <B>(f: (a: A) => B) => Form<B>;
  ap: <B>(fab: Form<(a: A) => B>) => Form<B>;
  addField: A extends (arg: infer Arg) => infer Result ? (fab: Form<Arg>) => Form<Result> : never;
}

export const applicativeForm = {
  map: <A, B>(fa: Form<A>, f: (a: A) => B): Form<B> => null as any,
  of: <A>(a: A): Form<A> => null as any,
  ap: <A, B>(fab: Form<(a: A) => B>, fa: Form<A>): Form<B> => null as any,
};

export const map = applicativeForm.map;
export const of = applicativeForm.of;
export const ap = applicativeForm.ap;

export const initial = <A>(value: A): Form<A> => applicativeForm.of(value);
export const empty = <A>(fieldName: string): Form<A> => null as any;

export const textField = (fieldName: string): Form<string> => empty(fieldName);
export const optionalTextField = (fieldName: string): Form<Option<string>> => empty(fieldName);
export const intField = (fieldName: string): Form<number> => empty(fieldName);
export const withInitial = <A>(initialValue: A, form: Form<A>): Form<A> => null as any;
export const withValidator = <A>(validate: (raw: string) => Either<Array<string>, A>, form: Form<A>): Form<A> =>
  null as any;

export type UpdateError = { error: 'unknownField'; fieldName: string } | { error: 'fieldIsNotPrimitive' };

export const updateField = <A, B>(form: Form<A>, field: Form<B>, raw: string): Either<UpdateError, Form<A>> =>
  right(form);
export const updateFields = <A, B>(form: Form<A>, fields: Array<[Form<B>, string]>): Either<UpdateError, Form<A>> =>
  right(form);

// — some stupid law example
// — multiple application of updateField should be identical to updateFields
// const firstField = textField('first');
// const secondField = textField('second');
// const form = of(tuple)
//   .addField(firstField)
//   .addField(secondField);
// updateField(
//   updateField(
//     form,
//     firstField,
//     x
//   )),
//   secondField,
//   y
// )
// ===
// updateFields(
//   form,
//   [[firstField, x], [secondField, y]]
// )
