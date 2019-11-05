import { OutputOf, string, type, Type, TypeOf, Validation } from 'io-ts';
import * as React from 'react';
import { useState } from 'react';
import { either, left, map, right } from 'fp-ts/lib/Either';
import { sequenceS } from 'fp-ts/lib/Apply';
import { NumberFromString } from 'io-ts-types/lib/NumberFromString';
import { pipe } from 'fp-ts/lib/pipeable';

const formDataCodec = type({
  age: NumberFromString,
  password: string,
  repeatPassword: string,
});
type FormData = TypeOf<typeof formDataCodec>;
type RawFormData = OutputOf<typeof formDataCodec>;

//
interface Value<Raw, Validated> {
  raw: Raw;
  validated: Validation<Validated>;
}
interface ControlProps<A> {
  value: A;
  onChange: (a: A) => void;
}
const sequenceSEither = sequenceS(either);
//

interface FormChildrenProps<Raw extends object, Validated>
  extends ControlProps<{
    age: Value<string, number>;
    password: Value<string, string>;
    repeatPassword: Value<string, string>;
  }> {}
// ControlProps<Value<FormData>> <-> ControlProps<{age: Value<string, number>;
// 		password: Value<string, string>;
// 		repeatPassword: Value<string, string>;}>

interface FormProps<Raw extends object, Validated> extends ControlProps<Value<Raw, Validated>> {
  children: (props: FormChildrenProps<Raw, Validated>) => JSX.Element;
}

const Form = (props: FormProps<RawFormData, FormData>) => (
  <div>
    {props.children({
      value: {
        age: {
          raw: props.value.raw.age,
          validated: pipe(
            props.value.validated,
            map(v => v.age),
          ),
        },
        password: {
          raw: props.value.raw.password,
          validated: pipe(
            props.value.validated,
            map(v => v.password),
          ),
        },
        repeatPassword: {
          raw: props.value.raw.repeatPassword,
          validated: pipe(
            props.value.validated,
            map(v => v.repeatPassword),
          ),
        },
      },
      onChange: smth => {
        console.log(
          'smth',
          {
            age: smth.age.validated,
            password: smth.password.validated,
            repeatPassword: smth.repeatPassword.validated,
          },
          sequenceSEither({
            age: smth.age.validated,
            password: smth.password.validated,
            repeatPassword: smth.repeatPassword.validated,
          }),
        );
        return props.onChange({
          raw: {
            age: smth.age.raw,
            password: smth.password.raw,
            repeatPassword: smth.repeatPassword.raw,
          },
          validated: sequenceSEither({
            age: smth.age.validated,
            password: smth.password.validated,
            repeatPassword: smth.repeatPassword.validated,
          }),
        });
      },
    })}
  </div>
);
//

interface FieldChildrenProps<Raw> extends ControlProps<Raw> {}
interface FieldProps<Raw, Validated> extends ControlProps<Value<Raw, Validated>> {
  children: (props: FieldChildrenProps<Raw>) => JSX.Element;
  codec: Type<Validated, Raw>;
}
const Field = <Raw, Validated>(props: FieldProps<Raw, Validated>) => {
  return props.children({
    value: props.value.raw,
    onChange: raw => props.onChange({ validated: props.codec.decode(raw), raw }),
  });
};
//

export default {
  title: 'Demo',
};

export const Demo = () => {
  const initial = {
    age: '',
    password: '',
    repeatPassword: '',
  };
  const [value, onChange] = useState<Value<RawFormData, FormData>>({
    raw: initial,
    validated: formDataCodec.decode(initial),
  });
  console.log('value', value);
  return (
    <Form value={value} onChange={onChange}>
      {props => (
        <div>
          <Field
            value={props.value.age}
            onChange={age => props.onChange({ ...props.value, age })}
            codec={formDataCodec.props.age}>
            {props => (
              <input
                placeholder={'age'}
                type="text"
                value={props.value}
                onChange={e => props.onChange(e.currentTarget.value)}
              />
            )}
          </Field>
          <Field
            value={props.value.password}
            onChange={password => props.onChange({ ...props.value, password })}
            codec={formDataCodec.props.password}>
            {props => (
              <input
                placeholder={'password'}
                type="text"
                value={props.value}
                onChange={e => props.onChange(e.currentTarget.value)}
              />
            )}
          </Field>
          <Field
            value={props.value.repeatPassword}
            onChange={repeatPassword => props.onChange({ ...props.value, repeatPassword })}
            codec={string}>
            {props => (
              <input
                placeholder={'repeatPassword'}
                type="text"
                value={props.value}
                onChange={e => props.onChange(e.currentTarget.value)}
              />
            )}
          </Field>
        </div>
      )}
    </Form>
  );
};
