import { registerDecorator, ValidationArguments, ValidationOptions } from "class-validator";

type IsUnionOption = (value: any) => boolean

export function IsUnion(validations: Array<IsUnionOption>, validationOptions?: ValidationOptions) {
  return function(object: object, propertyName: string) {
    registerDecorator({
      name: 'isUnion',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          for (let i = 0; i < validations.length; i++) {
            const validate = validations[i]
            if (validate(value)) return true
          }
          return false
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} should match at least one of the specified validation options.`
        },
      },
    });
  };
}

export function IsNotBlank(validationOptions?: ValidationOptions) {
  return function(object: object, propertyName: string) {
    registerDecorator({
      name: "isNotBlank",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return typeof value === "string" && value.trim().length > 0;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} should not be blank.`
        },
      },
    });
  };
}
