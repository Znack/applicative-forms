import { Option } from 'fp-ts/lib/Option';
import { Either } from 'fp-ts/lib/Either';

export interface Form<A> {
  map: <B>(f: (a: A) => B) => Form<B>;
  ap: <B>(fab: Form<(a: A) => B>) => Form<B>;
  apR: A extends (...args: any) => any
    ? (fab: Form<Parameters<A>[0]>) => Form<ReturnType<A>>
    : <B>(fab: Form<A>) => Form<B>;
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
export const withValidator = <A>(validate: (raw: string) => Either<Array<string>, A>, form: Form<A>): Form<A> =>
  null as any;
