export class RecipeFormError extends Error {
  readonly field: "photo" | "title" | "details";

  constructor(field: "photo" | "title" | "details", message: string) {
    super(message);
    this.field = field;
  }
}
