import { File } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

import { requestApi } from "#/shared/api";

import { RecipeFormError } from "./recipe-form-error";

export async function uploadPhoto(uri: string, familyId: string) {
  try {
    const image = await ImageManipulator.manipulate(uri).resize({ width: 1200 }).renderAsync();
    const photo = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });
    const bytes = await new File(photo.uri).bytes();

    const { imageKey } = await requestApi((client) =>
      client.images.upload({ params: { familyId }, payload: bytes }),
    );

    return imageKey;
  } catch {
    throw new RecipeFormError(
      "photo",
      "Couldn't upload the photo. Check your connection and try again, or remove the photo.",
    );
  }
}
