from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed


class ProdiaJWTAuthentication(JWTAuthentication):
    """
    ProdiaUser モデルを使ったカスタム JWT 認証クラス。
    標準の JWTAuthentication は Django の auth.User を参照するため、
    ProdiaUser（models.Model ベース）に差し替える。
    """

    def get_user(self, validated_token):
        from engineers.models import ProdiaUser

        user_id = validated_token.get("user_id")
        if user_id is None:
            raise InvalidToken("Token contained no recognizable user identification")

        try:
            user = ProdiaUser.objects.get(id=user_id)
        except ProdiaUser.DoesNotExist:
            raise AuthenticationFailed("User not found", code="user_not_found")

        if not user.is_active:
            raise AuthenticationFailed("User is inactive", code="user_inactive")

        return user
