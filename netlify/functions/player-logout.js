const { clearSessionCookie } = require("./_lib/auth");

exports.handler = async () => {
  return {
    statusCode: 302,
    headers: {
      Location: "/player-login",
      "Set-Cookie": clearSessionCookie(),
    },
    body: "",
  };
};
