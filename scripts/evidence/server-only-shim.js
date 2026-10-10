// `server-only` exists to make Next fail a build that imports a server module into a client
// bundle. Outside Next there is no bundler to guard, so it resolves to nothing. Used only by
// the evidence scripts, which are server-side by definition.
module.exports = {};
