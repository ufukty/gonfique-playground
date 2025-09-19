function redirect(ctx) {
  const url = new URL(ctx.request.url);

  if (url.hostname === "gonfique.pages.dev") {
    url.hostname = "gonfique.com";
    url.protocol = "https:";
    return Response.redirect(url.toString(), 308);
  }

  return ctx.next();
}

export const onRequest = [redirect];
