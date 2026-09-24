const { listPlayers } = require("./_lib/blobs");
const { renderDirectory } = require("./_lib/render-directory");

exports.handler = async () => {
  const players = await listPlayers();
  const html = renderDirectory(players);
  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=0, must-revalidate" },
    body: html,
  };
};
