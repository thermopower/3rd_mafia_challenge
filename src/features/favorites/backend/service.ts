import type { SupabaseClient } from "@supabase/supabase-js";
import {
  failure,
  success,
  type HandlerResult,
} from "@/backend/http/response";
import {
  FavoriteToggleResponseSchema,
  type FavoriteToggleResponse,
} from "@/features/favorites/backend/schema";
import {
  favoriteErrorCodes,
  type FavoriteServiceError,
} from "@/features/favorites/backend/error";

const FAVORITE_CONCERTS_TABLE = "favorite_concerts";
const CONCERTS_TABLE = "concerts";

export const toggleFavorite = async (
  client: SupabaseClient,
  userId: string,
  concertId: string
): Promise<
  HandlerResult<FavoriteToggleResponse, FavoriteServiceError, unknown>
> => {
  const { data: concertData, error: concertError } = await client
    .from(CONCERTS_TABLE)
    .select("id")
    .eq("id", concertId)
    .maybeSingle();

  if (concertError) {
    return failure(
      500,
      favoriteErrorCodes.toggleError,
      concertError.message
    );
  }

  if (!concertData) {
    return failure(
      404,
      favoriteErrorCodes.concertNotFound,
      "Concert not found"
    );
  }

  const { data: existingFavorite, error: fetchError } = await client
    .from(FAVORITE_CONCERTS_TABLE)
    .select("id")
    .eq("user_id", userId)
    .eq("concert_id", concertId)
    .maybeSingle();

  if (fetchError) {
    return failure(500, favoriteErrorCodes.toggleError, fetchError.message);
  }

  if (existingFavorite) {
    const { error: deleteError } = await client
      .from(FAVORITE_CONCERTS_TABLE)
      .delete()
      .eq("id", existingFavorite.id);

    if (deleteError) {
      return failure(500, favoriteErrorCodes.toggleError, deleteError.message);
    }

    const response: FavoriteToggleResponse = {
      isFavorite: false,
      message: "찜 해제되었습니다.",
    };

    const parsed = FavoriteToggleResponseSchema.safeParse(response);

    if (!parsed.success) {
      return failure(
        500,
        favoriteErrorCodes.validationError,
        "Favorite response failed validation.",
        parsed.error.format()
      );
    }

    return success(parsed.data);
  } else {
    const { error: insertError } = await client
      .from(FAVORITE_CONCERTS_TABLE)
      .insert({
        user_id: userId,
        concert_id: concertId,
      });

    if (insertError) {
      return failure(500, favoriteErrorCodes.toggleError, insertError.message);
    }

    const response: FavoriteToggleResponse = {
      isFavorite: true,
      message: "찜 목록에 추가되었습니다.",
    };

    const parsed = FavoriteToggleResponseSchema.safeParse(response);

    if (!parsed.success) {
      return failure(
        500,
        favoriteErrorCodes.validationError,
        "Favorite response failed validation.",
        parsed.error.format()
      );
    }

    return success(parsed.data);
  }
};
