(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

function _interopRequireDefault(e) {
  return e && e.__esModule ? e : {
    "default": e
  };
}
module.exports = _interopRequireDefault, module.exports.__esModule = true, module.exports["default"] = module.exports;

},{}],2:[function(require,module,exports){
"use strict";

/**
 * Expose `Emitter`.
 */

exports.Emitter = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
}

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on = Emitter.prototype.addEventListener = function (event, fn) {
  this._callbacks = this._callbacks || {};
  (this._callbacks['$' + event] = this._callbacks['$' + event] || []).push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function (event, fn) {
  function on() {
    this.off(event, on);
    fn.apply(this, arguments);
  }
  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off = Emitter.prototype.removeListener = Emitter.prototype.removeAllListeners = Emitter.prototype.removeEventListener = function (event, fn) {
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks['$' + event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks['$' + event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }

  // Remove event specific arrays for event types that no
  // one is subscribed for to avoid memory leak.
  if (callbacks.length === 0) {
    delete this._callbacks['$' + event];
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function (event) {
  this._callbacks = this._callbacks || {};
  var args = new Array(arguments.length - 1),
    callbacks = this._callbacks['$' + event];
  for (var i = 1; i < arguments.length; i++) {
    args[i - 1] = arguments[i];
  }
  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }
  return this;
};

// alias used for reserved events (protected method)
Emitter.prototype.emitReserved = Emitter.prototype.emit;

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function (event) {
  this._callbacks = this._callbacks || {};
  return this._callbacks['$' + event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function (event) {
  return !!this.listeners(event).length;
};

},{}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.hasCORS = void 0;
// imported from https://github.com/component/has-cors
let value = false;
try {
  value = typeof XMLHttpRequest !== 'undefined' && 'withCredentials' in new XMLHttpRequest();
} catch (err) {
  // if XMLHttp support is disabled in IE then it will throw
  // when trying to create
}
exports.hasCORS = value;

},{}],4:[function(require,module,exports){
"use strict";

// imported from https://github.com/galkn/querystring
/**
 * Compiles a querystring
 * Returns string representation of the object
 *
 * @param {Object}
 * @api private
 */
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.encode = encode;
exports.decode = decode;
function encode(obj) {
  let str = '';
  for (let i in obj) {
    if (obj.hasOwnProperty(i)) {
      if (str.length) str += '&';
      str += encodeURIComponent(i) + '=' + encodeURIComponent(obj[i]);
    }
  }
  return str;
}
/**
 * Parses a simple querystring into an object
 *
 * @param {String} qs
 * @api private
 */
function decode(qs) {
  let qry = {};
  let pairs = qs.split('&');
  for (let i = 0, l = pairs.length; i < l; i++) {
    let pair = pairs[i].split('=');
    qry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
  }
  return qry;
}

},{}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parse = parse;
// imported from https://github.com/galkn/parseuri
/**
 * Parses a URI
 *
 * Note: we could also have used the built-in URL object, but it isn't supported on all platforms.
 *
 * See:
 * - https://developer.mozilla.org/en-US/docs/Web/API/URL
 * - https://caniuse.com/url
 * - https://www.rfc-editor.org/rfc/rfc3986#appendix-B
 *
 * History of the parse() method:
 * - first commit: https://github.com/socketio/socket.io-client/commit/4ee1d5d94b3906a9c052b459f1a818b15f38f91c
 * - export into its own module: https://github.com/socketio/engine.io-client/commit/de2c561e4564efeb78f1bdb1ba39ef81b2822cb3
 * - reimport: https://github.com/socketio/engine.io-client/commit/df32277c3f6d622eec5ed09f493cae3f3391d242
 *
 * @author Steven Levithan <stevenlevithan.com> (MIT license)
 * @api private
 */
const re = /^(?:(?![^:@\/?#]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@\/?#]*)(?::([^:@\/?#]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;
const parts = ['source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'];
function parse(str) {
  if (str.length > 8000) {
    throw "URI too long";
  }
  const src = str,
    b = str.indexOf('['),
    e = str.indexOf(']');
  if (b != -1 && e != -1) {
    str = str.substring(0, b) + str.substring(b, e).replace(/:/g, ';') + str.substring(e, str.length);
  }
  let m = re.exec(str || ''),
    uri = {},
    i = 14;
  while (i--) {
    uri[parts[i]] = m[i] || '';
  }
  if (b != -1 && e != -1) {
    uri.source = src;
    uri.host = uri.host.substring(1, uri.host.length - 1).replace(/;/g, ':');
    uri.authority = uri.authority.replace('[', '').replace(']', '').replace(/;/g, ':');
    uri.ipv6uri = true;
  }
  uri.pathNames = pathNames(uri, uri['path']);
  uri.queryKey = queryKey(uri, uri['query']);
  return uri;
}
function pathNames(obj, path) {
  const regx = /\/{2,9}/g,
    names = path.replace(regx, "/").split("/");
  if (path.slice(0, 1) == '/' || path.length === 0) {
    names.splice(0, 1);
  }
  if (path.slice(-1) == '/') {
    names.splice(names.length - 1, 1);
  }
  return names;
}
function queryKey(uri, query) {
  const data = {};
  query.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function ($0, $1, $2) {
    if ($1) {
      data[$1] = $2;
    }
  });
  return data;
}

},{}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.defaultBinaryType = exports.globalThisShim = exports.nextTick = void 0;
exports.createCookieJar = createCookieJar;
exports.nextTick = (() => {
  const isPromiseAvailable = typeof Promise === "function" && typeof Promise.resolve === "function";
  if (isPromiseAvailable) {
    return cb => Promise.resolve().then(cb);
  } else {
    return (cb, setTimeoutFn) => setTimeoutFn(cb, 0);
  }
})();
exports.globalThisShim = (() => {
  if (typeof self !== "undefined") {
    return self;
  } else if (typeof window !== "undefined") {
    return window;
  } else {
    return Function("return this")();
  }
})();
exports.defaultBinaryType = "arraybuffer";
function createCookieJar() {}

},{}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WebTransport = exports.WebSocket = exports.NodeWebSocket = exports.XHR = exports.NodeXHR = exports.Fetch = exports.nextTick = exports.parse = exports.installTimerFunctions = exports.transports = exports.TransportError = exports.Transport = exports.protocol = exports.SocketWithUpgrade = exports.SocketWithoutUpgrade = exports.Socket = void 0;
const socket_js_1 = require("./socket.js");
Object.defineProperty(exports, "Socket", {
  enumerable: true,
  get: function () {
    return socket_js_1.Socket;
  }
});
var socket_js_2 = require("./socket.js");
Object.defineProperty(exports, "SocketWithoutUpgrade", {
  enumerable: true,
  get: function () {
    return socket_js_2.SocketWithoutUpgrade;
  }
});
Object.defineProperty(exports, "SocketWithUpgrade", {
  enumerable: true,
  get: function () {
    return socket_js_2.SocketWithUpgrade;
  }
});
exports.protocol = socket_js_1.Socket.protocol;
var transport_js_1 = require("./transport.js");
Object.defineProperty(exports, "Transport", {
  enumerable: true,
  get: function () {
    return transport_js_1.Transport;
  }
});
Object.defineProperty(exports, "TransportError", {
  enumerable: true,
  get: function () {
    return transport_js_1.TransportError;
  }
});
var index_js_1 = require("./transports/index.js");
Object.defineProperty(exports, "transports", {
  enumerable: true,
  get: function () {
    return index_js_1.transports;
  }
});
var util_js_1 = require("./util.js");
Object.defineProperty(exports, "installTimerFunctions", {
  enumerable: true,
  get: function () {
    return util_js_1.installTimerFunctions;
  }
});
var parseuri_js_1 = require("./contrib/parseuri.js");
Object.defineProperty(exports, "parse", {
  enumerable: true,
  get: function () {
    return parseuri_js_1.parse;
  }
});
var globals_node_js_1 = require("./globals.node.js");
Object.defineProperty(exports, "nextTick", {
  enumerable: true,
  get: function () {
    return globals_node_js_1.nextTick;
  }
});
var polling_fetch_js_1 = require("./transports/polling-fetch.js");
Object.defineProperty(exports, "Fetch", {
  enumerable: true,
  get: function () {
    return polling_fetch_js_1.Fetch;
  }
});
var polling_xhr_node_js_1 = require("./transports/polling-xhr.node.js");
Object.defineProperty(exports, "NodeXHR", {
  enumerable: true,
  get: function () {
    return polling_xhr_node_js_1.XHR;
  }
});
var polling_xhr_js_1 = require("./transports/polling-xhr.js");
Object.defineProperty(exports, "XHR", {
  enumerable: true,
  get: function () {
    return polling_xhr_js_1.XHR;
  }
});
var websocket_node_js_1 = require("./transports/websocket.node.js");
Object.defineProperty(exports, "NodeWebSocket", {
  enumerable: true,
  get: function () {
    return websocket_node_js_1.WS;
  }
});
var websocket_js_1 = require("./transports/websocket.js");
Object.defineProperty(exports, "WebSocket", {
  enumerable: true,
  get: function () {
    return websocket_js_1.WS;
  }
});
var webtransport_js_1 = require("./transports/webtransport.js");
Object.defineProperty(exports, "WebTransport", {
  enumerable: true,
  get: function () {
    return webtransport_js_1.WT;
  }
});

},{"./contrib/parseuri.js":5,"./globals.node.js":6,"./socket.js":8,"./transport.js":9,"./transports/index.js":10,"./transports/polling-fetch.js":11,"./transports/polling-xhr.js":12,"./transports/polling-xhr.node.js":12,"./transports/websocket.js":14,"./transports/websocket.node.js":14,"./transports/webtransport.js":15,"./util.js":16}],8:[function(require,module,exports){
"use strict";

var __importDefault = void 0 && (void 0).__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Socket = exports.SocketWithUpgrade = exports.SocketWithoutUpgrade = void 0;
const index_js_1 = require("./transports/index.js");
const util_js_1 = require("./util.js");
const parseqs_js_1 = require("./contrib/parseqs.js");
const parseuri_js_1 = require("./contrib/parseuri.js");
const component_emitter_1 = require("@socket.io/component-emitter");
const engine_io_parser_1 = require("engine.io-parser");
const globals_node_js_1 = require("./globals.node.js");
const debug_1 = __importDefault(require("debug")); // debug()
const debug = (0, debug_1.default)("engine.io-client:socket"); // debug()
const withEventListeners = typeof addEventListener === "function" && typeof removeEventListener === "function";
const OFFLINE_EVENT_LISTENERS = [];
if (withEventListeners) {
  // within a ServiceWorker, any event handler for the 'offline' event must be added on the initial evaluation of the
  // script, so we create one single event listener here which will forward the event to the socket instances
  addEventListener("offline", () => {
    debug("closing %d connection(s) because the network was lost", OFFLINE_EVENT_LISTENERS.length);
    OFFLINE_EVENT_LISTENERS.forEach(listener => listener());
  }, false);
}
/**
 * This class provides a WebSocket-like interface to connect to an Engine.IO server. The connection will be established
 * with one of the available low-level transports, like HTTP long-polling, WebSocket or WebTransport.
 *
 * This class comes without upgrade mechanism, which means that it will keep the first low-level transport that
 * successfully establishes the connection.
 *
 * In order to allow tree-shaking, there are no transports included, that's why the `transports` option is mandatory.
 *
 * @example
 * import { SocketWithoutUpgrade, WebSocket } from "engine.io-client";
 *
 * const socket = new SocketWithoutUpgrade({
 *   transports: [WebSocket]
 * });
 *
 * socket.on("open", () => {
 *   socket.send("hello");
 * });
 *
 * @see SocketWithUpgrade
 * @see Socket
 */
class SocketWithoutUpgrade extends component_emitter_1.Emitter {
  /**
   * Socket constructor.
   *
   * @param {String|Object} uri - uri or options
   * @param {Object} opts - options
   */
  constructor(uri, opts) {
    super();
    this.binaryType = globals_node_js_1.defaultBinaryType;
    this.writeBuffer = [];
    this._prevBufferLen = 0;
    this._pingInterval = -1;
    this._pingTimeout = -1;
    this._maxPayload = -1;
    /**
     * The expiration timestamp of the {@link _pingTimeoutTimer} object is tracked, in case the timer is throttled and the
     * callback is not fired on time. This can happen for example when a laptop is suspended or when a phone is locked.
     */
    this._pingTimeoutTime = Infinity;
    if (uri && "object" === typeof uri) {
      opts = uri;
      uri = null;
    }
    if (uri) {
      const parsedUri = (0, parseuri_js_1.parse)(uri);
      opts.hostname = parsedUri.host;
      opts.secure = parsedUri.protocol === "https" || parsedUri.protocol === "wss";
      opts.port = parsedUri.port;
      if (parsedUri.query) opts.query = parsedUri.query;
    } else if (opts.host) {
      opts.hostname = (0, parseuri_js_1.parse)(opts.host).host;
    }
    (0, util_js_1.installTimerFunctions)(this, opts);
    this.secure = null != opts.secure ? opts.secure : typeof location !== "undefined" && "https:" === location.protocol;
    if (opts.hostname && !opts.port) {
      // if no port is specified manually, use the protocol default
      opts.port = this.secure ? "443" : "80";
    }
    this.hostname = opts.hostname || (typeof location !== "undefined" ? location.hostname : "localhost");
    this.port = opts.port || (typeof location !== "undefined" && location.port ? location.port : this.secure ? "443" : "80");
    this.transports = [];
    this._transportsByName = {};
    opts.transports.forEach(t => {
      const transportName = t.prototype.name;
      this.transports.push(transportName);
      this._transportsByName[transportName] = t;
    });
    this.opts = Object.assign({
      path: "/engine.io",
      agent: false,
      withCredentials: false,
      upgrade: true,
      timestampParam: "t",
      rememberUpgrade: false,
      addTrailingSlash: true,
      rejectUnauthorized: true,
      perMessageDeflate: {
        threshold: 1024
      },
      transportOptions: {},
      closeOnBeforeunload: false
    }, opts);
    this.opts.path = this.opts.path.replace(/\/$/, "") + (this.opts.addTrailingSlash ? "/" : "");
    if (typeof this.opts.query === "string") {
      this.opts.query = (0, parseqs_js_1.decode)(this.opts.query);
    }
    if (withEventListeners) {
      if (this.opts.closeOnBeforeunload) {
        // Firefox closes the connection when the "beforeunload" event is emitted but not Chrome. This event listener
        // ensures every browser behaves the same (no "disconnect" event at the Socket.IO level when the page is
        // closed/reloaded)
        this._beforeunloadEventListener = () => {
          if (this.transport) {
            // silently close the transport
            this.transport.removeAllListeners();
            this.transport.close();
          }
        };
        addEventListener("beforeunload", this._beforeunloadEventListener, false);
      }
      if (this.hostname !== "localhost") {
        debug("adding listener for the 'offline' event");
        this._offlineEventListener = () => {
          this._onClose("transport close", {
            description: "network connection lost"
          });
        };
        OFFLINE_EVENT_LISTENERS.push(this._offlineEventListener);
      }
    }
    if (this.opts.withCredentials) {
      this._cookieJar = (0, globals_node_js_1.createCookieJar)();
    }
    this._open();
  }
  /**
   * Creates transport of the given type.
   *
   * @param {String} name - transport name
   * @return {Transport}
   * @private
   */
  createTransport(name) {
    debug('creating transport "%s"', name);
    const query = Object.assign({}, this.opts.query);
    // append engine.io protocol identifier
    query.EIO = engine_io_parser_1.protocol;
    // transport name
    query.transport = name;
    // session id if we already have one
    if (this.id) query.sid = this.id;
    const opts = Object.assign({}, this.opts, {
      query,
      socket: this,
      hostname: this.hostname,
      secure: this.secure,
      port: this.port
    }, this.opts.transportOptions[name]);
    debug("options: %j", opts);
    return new this._transportsByName[name](opts);
  }
  /**
   * Initializes transport to use and starts probe.
   *
   * @private
   */
  _open() {
    if (this.transports.length === 0) {
      // Emit error on next tick so it can be listened to
      this.setTimeoutFn(() => {
        this.emitReserved("error", "No transports available");
      }, 0);
      return;
    }
    const transportName = this.opts.rememberUpgrade && SocketWithoutUpgrade.priorWebsocketSuccess && this.transports.indexOf("websocket") !== -1 ? "websocket" : this.transports[0];
    this.readyState = "opening";
    const transport = this.createTransport(transportName);
    transport.open();
    this.setTransport(transport);
  }
  /**
   * Sets the current transport. Disables the existing one (if any).
   *
   * @private
   */
  setTransport(transport) {
    debug("setting transport %s", transport.name);
    if (this.transport) {
      debug("clearing existing transport %s", this.transport.name);
      this.transport.removeAllListeners();
    }
    // set up transport
    this.transport = transport;
    // set up transport listeners
    transport.on("drain", this._onDrain.bind(this)).on("packet", this._onPacket.bind(this)).on("error", this._onError.bind(this)).on("close", reason => this._onClose("transport close", reason));
  }
  /**
   * Called when connection is deemed open.
   *
   * @private
   */
  onOpen() {
    debug("socket open");
    this.readyState = "open";
    SocketWithoutUpgrade.priorWebsocketSuccess = "websocket" === this.transport.name;
    this.emitReserved("open");
    this.flush();
  }
  /**
   * Handles a packet.
   *
   * @private
   */
  _onPacket(packet) {
    if ("opening" === this.readyState || "open" === this.readyState || "closing" === this.readyState) {
      debug('socket receive: type "%s", data "%s"', packet.type, packet.data);
      this.emitReserved("packet", packet);
      // Socket is live - any packet counts
      this.emitReserved("heartbeat");
      switch (packet.type) {
        case "open":
          this.onHandshake(JSON.parse(packet.data));
          break;
        case "ping":
          this._sendPacket("pong");
          this.emitReserved("ping");
          this.emitReserved("pong");
          this._resetPingTimeout();
          break;
        case "error":
          const err = new Error("server error");
          // @ts-ignore
          err.code = packet.data;
          this._onError(err);
          break;
        case "message":
          this.emitReserved("data", packet.data);
          this.emitReserved("message", packet.data);
          break;
      }
    } else {
      debug('packet received with socket readyState "%s"', this.readyState);
    }
  }
  /**
   * Called upon handshake completion.
   *
   * @param {Object} data - handshake obj
   * @private
   */
  onHandshake(data) {
    this.emitReserved("handshake", data);
    this.id = data.sid;
    this.transport.query.sid = data.sid;
    this._pingInterval = data.pingInterval;
    this._pingTimeout = data.pingTimeout;
    this._maxPayload = data.maxPayload;
    this.onOpen();
    // In case open handler closes socket
    if ("closed" === this.readyState) return;
    this._resetPingTimeout();
  }
  /**
   * Sets and resets ping timeout timer based on server pings.
   *
   * @private
   */
  _resetPingTimeout() {
    this.clearTimeoutFn(this._pingTimeoutTimer);
    const delay = this._pingInterval + this._pingTimeout;
    this._pingTimeoutTime = Date.now() + delay;
    this._pingTimeoutTimer = this.setTimeoutFn(() => {
      this._onClose("ping timeout");
    }, delay);
    if (this.opts.autoUnref) {
      this._pingTimeoutTimer.unref();
    }
  }
  /**
   * Called on `drain` event
   *
   * @private
   */
  _onDrain() {
    this.writeBuffer.splice(0, this._prevBufferLen);
    // setting prevBufferLen = 0 is very important
    // for example, when upgrading, upgrade packet is sent over,
    // and a nonzero prevBufferLen could cause problems on `drain`
    this._prevBufferLen = 0;
    if (0 === this.writeBuffer.length) {
      this.emitReserved("drain");
    } else {
      this.flush();
    }
  }
  /**
   * Flush write buffers.
   *
   * @private
   */
  flush() {
    if ("closed" !== this.readyState && this.transport.writable && !this.upgrading && this.writeBuffer.length) {
      const packets = this._getWritablePackets();
      debug("flushing %d packets in socket", packets.length);
      this.transport.send(packets);
      // keep track of current length of writeBuffer
      // splice writeBuffer and callbackBuffer on `drain`
      this._prevBufferLen = packets.length;
      this.emitReserved("flush");
    }
  }
  /**
   * Ensure the encoded size of the writeBuffer is below the maxPayload value sent by the server (only for HTTP
   * long-polling)
   *
   * @private
   */
  _getWritablePackets() {
    const shouldCheckPayloadSize = this._maxPayload && this.transport.name === "polling" && this.writeBuffer.length > 1;
    if (!shouldCheckPayloadSize) {
      return this.writeBuffer;
    }
    let payloadSize = 1; // first packet type
    for (let i = 0; i < this.writeBuffer.length; i++) {
      const data = this.writeBuffer[i].data;
      if (data) {
        payloadSize += (0, util_js_1.byteLength)(data);
      }
      if (i > 0 && payloadSize > this._maxPayload) {
        debug("only send %d out of %d packets", i, this.writeBuffer.length);
        return this.writeBuffer.slice(0, i);
      }
      payloadSize += 2; // separator + packet type
    }
    debug("payload size is %d (max: %d)", payloadSize, this._maxPayload);
    return this.writeBuffer;
  }
  /**
   * Checks whether the heartbeat timer has expired but the socket has not yet been notified.
   *
   * Note: this method is private for now because it does not really fit the WebSocket API, but if we put it in the
   * `write()` method then the message would not be buffered by the Socket.IO client.
   *
   * @return {boolean}
   * @private
   */
  /* private */
  _hasPingExpired() {
    if (!this._pingTimeoutTime) return true;
    const hasExpired = Date.now() > this._pingTimeoutTime;
    if (hasExpired) {
      debug("throttled timer detected, scheduling connection close");
      this._pingTimeoutTime = 0;
      (0, globals_node_js_1.nextTick)(() => {
        this._onClose("ping timeout");
      }, this.setTimeoutFn);
    }
    return hasExpired;
  }
  /**
   * Sends a message.
   *
   * @param {String} msg - message.
   * @param {Object} options.
   * @param {Function} fn - callback function.
   * @return {Socket} for chaining.
   */
  write(msg, options, fn) {
    this._sendPacket("message", msg, options, fn);
    return this;
  }
  /**
   * Sends a message. Alias of {@link Socket#write}.
   *
   * @param {String} msg - message.
   * @param {Object} options.
   * @param {Function} fn - callback function.
   * @return {Socket} for chaining.
   */
  send(msg, options, fn) {
    this._sendPacket("message", msg, options, fn);
    return this;
  }
  /**
   * Sends a packet.
   *
   * @param {String} type: packet type.
   * @param {String} data.
   * @param {Object} options.
   * @param {Function} fn - callback function.
   * @private
   */
  _sendPacket(type, data, options, fn) {
    if ("function" === typeof data) {
      fn = data;
      data = undefined;
    }
    if ("function" === typeof options) {
      fn = options;
      options = null;
    }
    if ("closing" === this.readyState || "closed" === this.readyState) {
      return;
    }
    options = options || {};
    options.compress = false !== options.compress;
    const packet = {
      type: type,
      data: data,
      options: options
    };
    this.emitReserved("packetCreate", packet);
    this.writeBuffer.push(packet);
    if (fn) this.once("flush", fn);
    this.flush();
  }
  /**
   * Closes the connection.
   */
  close() {
    const close = () => {
      this._onClose("forced close");
      debug("socket closing - telling transport to close");
      this.transport.close();
    };
    const cleanupAndClose = () => {
      this.off("upgrade", cleanupAndClose);
      this.off("upgradeError", cleanupAndClose);
      close();
    };
    const waitForUpgrade = () => {
      // wait for upgrade to finish since we can't send packets while pausing a transport
      this.once("upgrade", cleanupAndClose);
      this.once("upgradeError", cleanupAndClose);
    };
    if ("opening" === this.readyState || "open" === this.readyState) {
      this.readyState = "closing";
      if (this.writeBuffer.length) {
        this.once("drain", () => {
          if (this.upgrading) {
            waitForUpgrade();
          } else {
            close();
          }
        });
      } else if (this.upgrading) {
        waitForUpgrade();
      } else {
        close();
      }
    }
    return this;
  }
  /**
   * Called upon transport error
   *
   * @private
   */
  _onError(err) {
    debug("socket error %j", err);
    SocketWithoutUpgrade.priorWebsocketSuccess = false;
    if (this.opts.tryAllTransports && this.transports.length > 1 && this.readyState === "opening") {
      debug("trying next transport");
      this.transports.shift();
      return this._open();
    }
    this.emitReserved("error", err);
    this._onClose("transport error", err);
  }
  /**
   * Called upon transport close.
   *
   * @private
   */
  _onClose(reason, description) {
    if ("opening" === this.readyState || "open" === this.readyState || "closing" === this.readyState) {
      debug('socket close with reason: "%s"', reason);
      // clear timers
      this.clearTimeoutFn(this._pingTimeoutTimer);
      // stop event from firing again for transport
      this.transport.removeAllListeners("close");
      // ensure transport won't stay open
      this.transport.close();
      // ignore further transport communication
      this.transport.removeAllListeners();
      if (withEventListeners) {
        if (this._beforeunloadEventListener) {
          removeEventListener("beforeunload", this._beforeunloadEventListener, false);
        }
        if (this._offlineEventListener) {
          const i = OFFLINE_EVENT_LISTENERS.indexOf(this._offlineEventListener);
          if (i !== -1) {
            debug("removing listener for the 'offline' event");
            OFFLINE_EVENT_LISTENERS.splice(i, 1);
          }
        }
      }
      // set ready state
      this.readyState = "closed";
      // clear session id
      this.id = null;
      // emit close event
      this.emitReserved("close", reason, description);
      // clean buffers after, so users can still
      // grab the buffers on `close` event
      this.writeBuffer = [];
      this._prevBufferLen = 0;
    }
  }
}
exports.SocketWithoutUpgrade = SocketWithoutUpgrade;
SocketWithoutUpgrade.protocol = engine_io_parser_1.protocol;
/**
 * This class provides a WebSocket-like interface to connect to an Engine.IO server. The connection will be established
 * with one of the available low-level transports, like HTTP long-polling, WebSocket or WebTransport.
 *
 * This class comes with an upgrade mechanism, which means that once the connection is established with the first
 * low-level transport, it will try to upgrade to a better transport.
 *
 * In order to allow tree-shaking, there are no transports included, that's why the `transports` option is mandatory.
 *
 * @example
 * import { SocketWithUpgrade, WebSocket } from "engine.io-client";
 *
 * const socket = new SocketWithUpgrade({
 *   transports: [WebSocket]
 * });
 *
 * socket.on("open", () => {
 *   socket.send("hello");
 * });
 *
 * @see SocketWithoutUpgrade
 * @see Socket
 */
class SocketWithUpgrade extends SocketWithoutUpgrade {
  constructor() {
    super(...arguments);
    this._upgrades = [];
  }
  onOpen() {
    super.onOpen();
    if ("open" === this.readyState && this.opts.upgrade) {
      debug("starting upgrade probes");
      for (let i = 0; i < this._upgrades.length; i++) {
        this._probe(this._upgrades[i]);
      }
    }
  }
  /**
   * Probes a transport.
   *
   * @param {String} name - transport name
   * @private
   */
  _probe(name) {
    debug('probing transport "%s"', name);
    let transport = this.createTransport(name);
    let failed = false;
    SocketWithoutUpgrade.priorWebsocketSuccess = false;
    const onTransportOpen = () => {
      if (failed) return;
      debug('probe transport "%s" opened', name);
      transport.send([{
        type: "ping",
        data: "probe"
      }]);
      transport.once("packet", msg => {
        if (failed) return;
        if ("pong" === msg.type && "probe" === msg.data) {
          debug('probe transport "%s" pong', name);
          this.upgrading = true;
          this.emitReserved("upgrading", transport);
          if (!transport) return;
          SocketWithoutUpgrade.priorWebsocketSuccess = "websocket" === transport.name;
          debug('pausing current transport "%s"', this.transport.name);
          this.transport.pause(() => {
            if (failed) return;
            if ("closed" === this.readyState) return;
            debug("changing transport and sending upgrade packet");
            cleanup();
            this.setTransport(transport);
            transport.send([{
              type: "upgrade"
            }]);
            this.emitReserved("upgrade", transport);
            transport = null;
            this.upgrading = false;
            this.flush();
          });
        } else {
          debug('probe transport "%s" failed', name);
          const err = new Error("probe error");
          // @ts-ignore
          err.transport = transport.name;
          this.emitReserved("upgradeError", err);
        }
      });
    };
    function freezeTransport() {
      if (failed) return;
      // Any callback called by transport should be ignored since now
      failed = true;
      cleanup();
      transport.close();
      transport = null;
    }
    // Handle any error that happens while probing
    const onerror = err => {
      const error = new Error("probe error: " + err);
      // @ts-ignore
      error.transport = transport.name;
      freezeTransport();
      debug('probe transport "%s" failed because of error: %s', name, err);
      this.emitReserved("upgradeError", error);
    };
    function onTransportClose() {
      onerror("transport closed");
    }
    // When the socket is closed while we're probing
    function onclose() {
      onerror("socket closed");
    }
    // When the socket is upgraded while we're probing
    function onupgrade(to) {
      if (transport && to.name !== transport.name) {
        debug('"%s" works - aborting "%s"', to.name, transport.name);
        freezeTransport();
      }
    }
    // Remove all listeners on the transport and on self
    const cleanup = () => {
      transport.removeListener("open", onTransportOpen);
      transport.removeListener("error", onerror);
      transport.removeListener("close", onTransportClose);
      this.off("close", onclose);
      this.off("upgrading", onupgrade);
    };
    transport.once("open", onTransportOpen);
    transport.once("error", onerror);
    transport.once("close", onTransportClose);
    this.once("close", onclose);
    this.once("upgrading", onupgrade);
    if (this._upgrades.indexOf("webtransport") !== -1 && name !== "webtransport") {
      // favor WebTransport
      this.setTimeoutFn(() => {
        if (!failed) {
          transport.open();
        }
      }, 200);
    } else {
      transport.open();
    }
  }
  onHandshake(data) {
    this._upgrades = this._filterUpgrades(data.upgrades);
    super.onHandshake(data);
  }
  /**
   * Filters upgrades, returning only those matching client transports.
   *
   * @param {Array} upgrades - server upgrades
   * @private
   */
  _filterUpgrades(upgrades) {
    const filteredUpgrades = [];
    for (let i = 0; i < upgrades.length; i++) {
      if (~this.transports.indexOf(upgrades[i])) filteredUpgrades.push(upgrades[i]);
    }
    return filteredUpgrades;
  }
}
exports.SocketWithUpgrade = SocketWithUpgrade;
/**
 * This class provides a WebSocket-like interface to connect to an Engine.IO server. The connection will be established
 * with one of the available low-level transports, like HTTP long-polling, WebSocket or WebTransport.
 *
 * This class comes with an upgrade mechanism, which means that once the connection is established with the first
 * low-level transport, it will try to upgrade to a better transport.
 *
 * @example
 * import { Socket } from "engine.io-client";
 *
 * const socket = new Socket();
 *
 * socket.on("open", () => {
 *   socket.send("hello");
 * });
 *
 * @see SocketWithoutUpgrade
 * @see SocketWithUpgrade
 */
class Socket extends SocketWithUpgrade {
  constructor(uri, opts = {}) {
    const o = typeof uri === "object" ? uri : opts;
    if (!o.transports || o.transports && typeof o.transports[0] === "string") {
      o.transports = (o.transports || ["polling", "websocket", "webtransport"]).map(transportName => index_js_1.transports[transportName]).filter(t => !!t);
    }
    super(uri, o);
  }
}
exports.Socket = Socket;

},{"./contrib/parseqs.js":4,"./contrib/parseuri.js":5,"./globals.node.js":6,"./transports/index.js":10,"./util.js":16,"@socket.io/component-emitter":2,"debug":17,"engine.io-parser":23}],9:[function(require,module,exports){
"use strict";

var __importDefault = void 0 && (void 0).__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Transport = exports.TransportError = void 0;
const engine_io_parser_1 = require("engine.io-parser");
const component_emitter_1 = require("@socket.io/component-emitter");
const util_js_1 = require("./util.js");
const parseqs_js_1 = require("./contrib/parseqs.js");
const debug_1 = __importDefault(require("debug")); // debug()
const debug = (0, debug_1.default)("engine.io-client:transport"); // debug()
class TransportError extends Error {
  constructor(reason, description, context) {
    super(reason);
    this.description = description;
    this.context = context;
    this.type = "TransportError";
  }
}
exports.TransportError = TransportError;
class Transport extends component_emitter_1.Emitter {
  /**
   * Transport abstract constructor.
   *
   * @param {Object} opts - options
   * @protected
   */
  constructor(opts) {
    super();
    this.writable = false;
    (0, util_js_1.installTimerFunctions)(this, opts);
    this.opts = opts;
    this.query = opts.query;
    this.socket = opts.socket;
    this.supportsBinary = !opts.forceBase64;
  }
  /**
   * Emits an error.
   *
   * @param {String} reason
   * @param description
   * @param context - the error context
   * @return {Transport} for chaining
   * @protected
   */
  onError(reason, description, context) {
    super.emitReserved("error", new TransportError(reason, description, context));
    return this;
  }
  /**
   * Opens the transport.
   */
  open() {
    this.readyState = "opening";
    this.doOpen();
    return this;
  }
  /**
   * Closes the transport.
   */
  close() {
    if (this.readyState === "opening" || this.readyState === "open") {
      this.doClose();
      this.onClose();
    }
    return this;
  }
  /**
   * Sends multiple packets.
   *
   * @param {Array} packets
   */
  send(packets) {
    if (this.readyState === "open") {
      this.write(packets);
    } else {
      // this might happen if the transport was silently closed in the beforeunload event handler
      debug("transport is not open, discarding packets");
    }
  }
  /**
   * Called upon open
   *
   * @protected
   */
  onOpen() {
    this.readyState = "open";
    this.writable = true;
    super.emitReserved("open");
  }
  /**
   * Called with data.
   *
   * @param {String} data
   * @protected
   */
  onData(data) {
    const packet = (0, engine_io_parser_1.decodePacket)(data, this.socket.binaryType);
    this.onPacket(packet);
  }
  /**
   * Called with a decoded packet.
   *
   * @protected
   */
  onPacket(packet) {
    super.emitReserved("packet", packet);
  }
  /**
   * Called upon close.
   *
   * @protected
   */
  onClose(details) {
    this.readyState = "closed";
    super.emitReserved("close", details);
  }
  /**
   * Pauses the transport, in order not to lose packets during an upgrade.
   *
   * @param onPause
   */
  pause(onPause) {}
  createUri(schema, query = {}) {
    return schema + "://" + this._hostname() + this._port() + this.opts.path + this._query(query);
  }
  _hostname() {
    const hostname = this.opts.hostname;
    return hostname.indexOf(":") === -1 ? hostname : "[" + hostname + "]";
  }
  _port() {
    if (this.opts.port && (this.opts.secure && Number(this.opts.port !== 443) || !this.opts.secure && Number(this.opts.port) !== 80)) {
      return ":" + this.opts.port;
    } else {
      return "";
    }
  }
  _query(query) {
    const encodedQuery = (0, parseqs_js_1.encode)(query);
    return encodedQuery.length ? "?" + encodedQuery : "";
  }
}
exports.Transport = Transport;

},{"./contrib/parseqs.js":4,"./util.js":16,"@socket.io/component-emitter":2,"debug":17,"engine.io-parser":23}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.transports = void 0;
const polling_xhr_node_js_1 = require("./polling-xhr.node.js");
const websocket_node_js_1 = require("./websocket.node.js");
const webtransport_js_1 = require("./webtransport.js");
exports.transports = {
  websocket: websocket_node_js_1.WS,
  webtransport: webtransport_js_1.WT,
  polling: polling_xhr_node_js_1.XHR
};

},{"./polling-xhr.node.js":12,"./websocket.node.js":14,"./webtransport.js":15}],11:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Fetch = void 0;
const polling_js_1 = require("./polling.js");
/**
 * HTTP long-polling based on the built-in `fetch()` method.
 *
 * Usage: browser, Node.js (since v18), Deno, Bun
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/fetch
 * @see https://caniuse.com/fetch
 * @see https://nodejs.org/api/globals.html#fetch
 */
class Fetch extends polling_js_1.Polling {
  doPoll() {
    this._fetch().then(res => {
      if (!res.ok) {
        return this.onError("fetch read error", res.status, res);
      }
      res.text().then(data => this.onData(data));
    }).catch(err => {
      this.onError("fetch read error", err);
    });
  }
  doWrite(data, callback) {
    this._fetch(data).then(res => {
      if (!res.ok) {
        return this.onError("fetch write error", res.status, res);
      }
      callback();
    }).catch(err => {
      this.onError("fetch write error", err);
    });
  }
  _fetch(data) {
    var _a;
    const isPost = data !== undefined;
    const headers = new Headers(this.opts.extraHeaders);
    if (isPost) {
      headers.set("content-type", "text/plain;charset=UTF-8");
    }
    (_a = this.socket._cookieJar) === null || _a === void 0 ? void 0 : _a.appendCookies(headers);
    return fetch(this.uri(), {
      method: isPost ? "POST" : "GET",
      body: isPost ? data : null,
      headers,
      credentials: this.opts.withCredentials ? "include" : "omit"
    }).then(res => {
      var _a;
      // @ts-ignore getSetCookie() was added in Node.js v19.7.0
      (_a = this.socket._cookieJar) === null || _a === void 0 ? void 0 : _a.parseCookies(res.headers.getSetCookie());
      return res;
    });
  }
}
exports.Fetch = Fetch;

},{"./polling.js":13}],12:[function(require,module,exports){
"use strict";

var __importDefault = void 0 && (void 0).__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.XHR = exports.Request = exports.BaseXHR = void 0;
const polling_js_1 = require("./polling.js");
const component_emitter_1 = require("@socket.io/component-emitter");
const util_js_1 = require("../util.js");
const globals_node_js_1 = require("../globals.node.js");
const has_cors_js_1 = require("../contrib/has-cors.js");
const debug_1 = __importDefault(require("debug")); // debug()
const debug = (0, debug_1.default)("engine.io-client:polling"); // debug()
function empty() {}
class BaseXHR extends polling_js_1.Polling {
  /**
   * XHR Polling constructor.
   *
   * @param {Object} opts
   * @package
   */
  constructor(opts) {
    super(opts);
    if (typeof location !== "undefined") {
      const isSSL = "https:" === location.protocol;
      let port = location.port;
      // some user agents have empty `location.port`
      if (!port) {
        port = isSSL ? "443" : "80";
      }
      this.xd = typeof location !== "undefined" && opts.hostname !== location.hostname || port !== opts.port;
    }
  }
  /**
   * Sends data.
   *
   * @param {String} data to send.
   * @param {Function} called upon flush.
   * @private
   */
  doWrite(data, fn) {
    const req = this.request({
      method: "POST",
      data: data
    });
    req.on("success", fn);
    req.on("error", (xhrStatus, context) => {
      this.onError("xhr post error", xhrStatus, context);
    });
  }
  /**
   * Starts a poll cycle.
   *
   * @private
   */
  doPoll() {
    debug("xhr poll");
    const req = this.request();
    req.on("data", this.onData.bind(this));
    req.on("error", (xhrStatus, context) => {
      this.onError("xhr poll error", xhrStatus, context);
    });
    this.pollXhr = req;
  }
}
exports.BaseXHR = BaseXHR;
class Request extends component_emitter_1.Emitter {
  /**
   * Request constructor
   *
   * @param {Object} options
   * @package
   */
  constructor(createRequest, uri, opts) {
    super();
    this.createRequest = createRequest;
    (0, util_js_1.installTimerFunctions)(this, opts);
    this._opts = opts;
    this._method = opts.method || "GET";
    this._uri = uri;
    this._data = undefined !== opts.data ? opts.data : null;
    this._create();
  }
  /**
   * Creates the XHR object and sends the request.
   *
   * @private
   */
  _create() {
    var _a;
    const opts = (0, util_js_1.pick)(this._opts, "agent", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "autoUnref");
    opts.xdomain = !!this._opts.xd;
    const xhr = this._xhr = this.createRequest(opts);
    try {
      debug("xhr open %s: %s", this._method, this._uri);
      xhr.open(this._method, this._uri, true);
      try {
        if (this._opts.extraHeaders) {
          // @ts-ignore
          xhr.setDisableHeaderCheck && xhr.setDisableHeaderCheck(true);
          for (let i in this._opts.extraHeaders) {
            if (this._opts.extraHeaders.hasOwnProperty(i)) {
              xhr.setRequestHeader(i, this._opts.extraHeaders[i]);
            }
          }
        }
      } catch (e) {}
      if ("POST" === this._method) {
        try {
          xhr.setRequestHeader("Content-type", "text/plain;charset=UTF-8");
        } catch (e) {}
      }
      try {
        xhr.setRequestHeader("Accept", "*/*");
      } catch (e) {}
      (_a = this._opts.cookieJar) === null || _a === void 0 ? void 0 : _a.addCookies(xhr);
      // ie6 check
      if ("withCredentials" in xhr) {
        xhr.withCredentials = this._opts.withCredentials;
      }
      if (this._opts.requestTimeout) {
        xhr.timeout = this._opts.requestTimeout;
      }
      xhr.onreadystatechange = () => {
        var _a;
        if (xhr.readyState === 3) {
          (_a = this._opts.cookieJar) === null || _a === void 0 ? void 0 : _a.parseCookies(
          // @ts-ignore
          xhr.getResponseHeader("set-cookie"));
        }
        if (4 !== xhr.readyState) return;
        if (200 === xhr.status || 1223 === xhr.status) {
          this._onLoad();
        } else {
          // make sure the `error` event handler that's user-set
          // does not throw in the same tick and gets caught here
          this.setTimeoutFn(() => {
            this._onError(typeof xhr.status === "number" ? xhr.status : 0);
          }, 0);
        }
      };
      debug("xhr data %s", this._data);
      xhr.send(this._data);
    } catch (e) {
      // Need to defer since .create() is called directly from the constructor
      // and thus the 'error' event can only be only bound *after* this exception
      // occurs.  Therefore, also, we cannot throw here at all.
      this.setTimeoutFn(() => {
        this._onError(e);
      }, 0);
      return;
    }
    if (typeof document !== "undefined") {
      this._index = Request.requestsCount++;
      Request.requests[this._index] = this;
    }
  }
  /**
   * Called upon error.
   *
   * @private
   */
  _onError(err) {
    this.emitReserved("error", err, this._xhr);
    this._cleanup(true);
  }
  /**
   * Cleans up house.
   *
   * @private
   */
  _cleanup(fromError) {
    if ("undefined" === typeof this._xhr || null === this._xhr) {
      return;
    }
    this._xhr.onreadystatechange = empty;
    if (fromError) {
      try {
        this._xhr.abort();
      } catch (e) {}
    }
    if (typeof document !== "undefined") {
      delete Request.requests[this._index];
    }
    this._xhr = null;
  }
  /**
   * Called upon load.
   *
   * @private
   */
  _onLoad() {
    const data = this._xhr.responseText;
    if (data !== null) {
      this.emitReserved("data", data);
      this.emitReserved("success");
      this._cleanup();
    }
  }
  /**
   * Aborts the request.
   *
   * @package
   */
  abort() {
    this._cleanup();
  }
}
exports.Request = Request;
Request.requestsCount = 0;
Request.requests = {};
/**
 * Aborts pending requests when unloading the window. This is needed to prevent
 * memory leaks (e.g. when using IE) and to ensure that no spurious error is
 * emitted.
 */
if (typeof document !== "undefined") {
  // @ts-ignore
  if (typeof attachEvent === "function") {
    // @ts-ignore
    attachEvent("onunload", unloadHandler);
  } else if (typeof addEventListener === "function") {
    const terminationEvent = "onpagehide" in globals_node_js_1.globalThisShim ? "pagehide" : "unload";
    addEventListener(terminationEvent, unloadHandler, false);
  }
}
function unloadHandler() {
  for (let i in Request.requests) {
    if (Request.requests.hasOwnProperty(i)) {
      Request.requests[i].abort();
    }
  }
}
const hasXHR2 = function () {
  const xhr = newRequest({
    xdomain: false
  });
  return xhr && xhr.responseType !== null;
}();
/**
 * HTTP long-polling based on the built-in `XMLHttpRequest` object.
 *
 * Usage: browser
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
 */
class XHR extends BaseXHR {
  constructor(opts) {
    super(opts);
    const forceBase64 = opts && opts.forceBase64;
    this.supportsBinary = hasXHR2 && !forceBase64;
  }
  request(opts = {}) {
    Object.assign(opts, {
      xd: this.xd
    }, this.opts);
    return new Request(newRequest, this.uri(), opts);
  }
}
exports.XHR = XHR;
function newRequest(opts) {
  const xdomain = opts.xdomain;
  // XMLHttpRequest can be disabled on IE
  try {
    if ("undefined" !== typeof XMLHttpRequest && (!xdomain || has_cors_js_1.hasCORS)) {
      return new XMLHttpRequest();
    }
  } catch (e) {}
  if (!xdomain) {
    try {
      return new globals_node_js_1.globalThisShim[["Active"].concat("Object").join("X")]("Microsoft.XMLHTTP");
    } catch (e) {}
  }
}

},{"../contrib/has-cors.js":3,"../globals.node.js":6,"../util.js":16,"./polling.js":13,"@socket.io/component-emitter":2,"debug":17}],13:[function(require,module,exports){
"use strict";

var __importDefault = void 0 && (void 0).__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Polling = void 0;
const transport_js_1 = require("../transport.js");
const util_js_1 = require("../util.js");
const engine_io_parser_1 = require("engine.io-parser");
const debug_1 = __importDefault(require("debug")); // debug()
const debug = (0, debug_1.default)("engine.io-client:polling"); // debug()
class Polling extends transport_js_1.Transport {
  constructor() {
    super(...arguments);
    this._polling = false;
  }
  get name() {
    return "polling";
  }
  /**
   * Opens the socket (triggers polling). We write a PING message to determine
   * when the transport is open.
   *
   * @protected
   */
  doOpen() {
    this._poll();
  }
  /**
   * Pauses polling.
   *
   * @param {Function} onPause - callback upon buffers are flushed and transport is paused
   * @package
   */
  pause(onPause) {
    this.readyState = "pausing";
    const pause = () => {
      debug("paused");
      this.readyState = "paused";
      onPause();
    };
    if (this._polling || !this.writable) {
      let total = 0;
      if (this._polling) {
        debug("we are currently polling - waiting to pause");
        total++;
        this.once("pollComplete", function () {
          debug("pre-pause polling complete");
          --total || pause();
        });
      }
      if (!this.writable) {
        debug("we are currently writing - waiting to pause");
        total++;
        this.once("drain", function () {
          debug("pre-pause writing complete");
          --total || pause();
        });
      }
    } else {
      pause();
    }
  }
  /**
   * Starts polling cycle.
   *
   * @private
   */
  _poll() {
    debug("polling");
    this._polling = true;
    this.doPoll();
    this.emitReserved("poll");
  }
  /**
   * Overloads onData to detect payloads.
   *
   * @protected
   */
  onData(data) {
    debug("polling got data %s", data);
    const callback = packet => {
      // if its the first message we consider the transport open
      if ("opening" === this.readyState && packet.type === "open") {
        this.onOpen();
      }
      // if its a close packet, we close the ongoing requests
      if ("close" === packet.type) {
        this.onClose({
          description: "transport closed by the server"
        });
        return false;
      }
      // otherwise bypass onData and handle the message
      this.onPacket(packet);
    };
    // decode payload
    (0, engine_io_parser_1.decodePayload)(data, this.socket.binaryType).forEach(callback);
    // if an event did not trigger closing
    if ("closed" !== this.readyState) {
      // if we got data we're not polling
      this._polling = false;
      this.emitReserved("pollComplete");
      if ("open" === this.readyState) {
        this._poll();
      } else {
        debug('ignoring poll - transport state "%s"', this.readyState);
      }
    }
  }
  /**
   * For polling, send a close packet.
   *
   * @protected
   */
  doClose() {
    const close = () => {
      debug("writing close packet");
      this.write([{
        type: "close"
      }]);
    };
    if ("open" === this.readyState) {
      debug("transport open - closing");
      close();
    } else {
      // in case we're trying to close while
      // handshaking is in progress (GH-164)
      debug("transport not open - deferring close");
      this.once("open", close);
    }
  }
  /**
   * Writes a packets payload.
   *
   * @param {Array} packets - data packets
   * @protected
   */
  write(packets) {
    this.writable = false;
    (0, engine_io_parser_1.encodePayload)(packets, data => {
      this.doWrite(data, () => {
        this.writable = true;
        this.emitReserved("drain");
      });
    });
  }
  /**
   * Generates uri for connection.
   *
   * @private
   */
  uri() {
    const schema = this.opts.secure ? "https" : "http";
    const query = this.query || {};
    // cache busting is forced
    if (false !== this.opts.timestampRequests) {
      query[this.opts.timestampParam] = (0, util_js_1.randomString)();
    }
    if (!this.supportsBinary && !query.sid) {
      query.b64 = 1;
    }
    return this.createUri(schema, query);
  }
}
exports.Polling = Polling;

},{"../transport.js":9,"../util.js":16,"debug":17,"engine.io-parser":23}],14:[function(require,module,exports){
"use strict";

var __importDefault = void 0 && (void 0).__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WS = exports.BaseWS = void 0;
const transport_js_1 = require("../transport.js");
const util_js_1 = require("../util.js");
const engine_io_parser_1 = require("engine.io-parser");
const globals_node_js_1 = require("../globals.node.js");
const debug_1 = __importDefault(require("debug")); // debug()
const debug = (0, debug_1.default)("engine.io-client:websocket"); // debug()
// detect ReactNative environment
const isReactNative = typeof navigator !== "undefined" && typeof navigator.product === "string" && navigator.product.toLowerCase() === "reactnative";
class BaseWS extends transport_js_1.Transport {
  get name() {
    return "websocket";
  }
  doOpen() {
    const uri = this.uri();
    const protocols = this.opts.protocols;
    // React Native only supports the 'headers' option, and will print a warning if anything else is passed
    const opts = isReactNative ? {} : (0, util_js_1.pick)(this.opts, "agent", "perMessageDeflate", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "localAddress", "protocolVersion", "origin", "maxPayload", "family", "checkServerIdentity");
    if (this.opts.extraHeaders) {
      opts.headers = this.opts.extraHeaders;
    }
    try {
      this.ws = this.createSocket(uri, protocols, opts);
    } catch (err) {
      return this.emitReserved("error", err);
    }
    this.ws.binaryType = this.socket.binaryType;
    this.addEventListeners();
  }
  /**
   * Adds event listeners to the socket
   *
   * @private
   */
  addEventListeners() {
    this.ws.onopen = () => {
      if (this.opts.autoUnref) {
        this.ws._socket.unref();
      }
      this.onOpen();
    };
    this.ws.onclose = closeEvent => this.onClose({
      description: "websocket connection closed",
      context: closeEvent
    });
    this.ws.onmessage = ev => this.onData(ev.data);
    this.ws.onerror = e => this.onError("websocket error", e);
  }
  write(packets) {
    this.writable = false;
    // encodePacket efficient as it uses WS framing
    // no need for encodePayload
    for (let i = 0; i < packets.length; i++) {
      const packet = packets[i];
      const lastPacket = i === packets.length - 1;
      (0, engine_io_parser_1.encodePacket)(packet, this.supportsBinary, data => {
        // Sometimes the websocket has already been closed but the browser didn't
        // have a chance of informing us about it yet, in that case send will
        // throw an error
        try {
          this.doWrite(packet, data);
        } catch (e) {
          debug("websocket closed before onclose event");
        }
        if (lastPacket) {
          // fake drain
          // defer to next tick to allow Socket to clear writeBuffer
          (0, globals_node_js_1.nextTick)(() => {
            this.writable = true;
            this.emitReserved("drain");
          }, this.setTimeoutFn);
        }
      });
    }
  }
  doClose() {
    if (typeof this.ws !== "undefined") {
      this.ws.onerror = () => {};
      this.ws.close();
      this.ws = null;
    }
  }
  /**
   * Generates uri for connection.
   *
   * @private
   */
  uri() {
    const schema = this.opts.secure ? "wss" : "ws";
    const query = this.query || {};
    // append timestamp to URI
    if (this.opts.timestampRequests) {
      query[this.opts.timestampParam] = (0, util_js_1.randomString)();
    }
    // communicate binary support capabilities
    if (!this.supportsBinary) {
      query.b64 = 1;
    }
    return this.createUri(schema, query);
  }
}
exports.BaseWS = BaseWS;
const WebSocketCtor = globals_node_js_1.globalThisShim.WebSocket || globals_node_js_1.globalThisShim.MozWebSocket;
/**
 * WebSocket transport based on the built-in `WebSocket` object.
 *
 * Usage: browser, Node.js (since v21), Deno, Bun
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
 * @see https://caniuse.com/mdn-api_websocket
 * @see https://nodejs.org/api/globals.html#websocket
 */
class WS extends BaseWS {
  createSocket(uri, protocols, opts) {
    return !isReactNative ? protocols ? new WebSocketCtor(uri, protocols) : new WebSocketCtor(uri) : new WebSocketCtor(uri, protocols, opts);
  }
  doWrite(_packet, data) {
    this.ws.send(data);
  }
}
exports.WS = WS;

},{"../globals.node.js":6,"../transport.js":9,"../util.js":16,"debug":17,"engine.io-parser":23}],15:[function(require,module,exports){
"use strict";

var __importDefault = void 0 && (void 0).__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WT = void 0;
const transport_js_1 = require("../transport.js");
const globals_node_js_1 = require("../globals.node.js");
const engine_io_parser_1 = require("engine.io-parser");
const debug_1 = __importDefault(require("debug")); // debug()
const debug = (0, debug_1.default)("engine.io-client:webtransport"); // debug()
/**
 * WebTransport transport based on the built-in `WebTransport` object.
 *
 * Usage: browser, Node.js (with the `@fails-components/webtransport` package)
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebTransport
 * @see https://caniuse.com/webtransport
 */
class WT extends transport_js_1.Transport {
  get name() {
    return "webtransport";
  }
  doOpen() {
    try {
      // @ts-ignore
      this._transport = new WebTransport(this.createUri("https"), this.opts.transportOptions[this.name]);
    } catch (err) {
      return this.emitReserved("error", err);
    }
    this._transport.closed.then(() => {
      debug("transport closed gracefully");
      this.onClose();
    }).catch(err => {
      debug("transport closed due to %s", err);
      this.onError("webtransport error", err);
    });
    // note: we could have used async/await, but that would require some additional polyfills
    this._transport.ready.then(() => {
      this._transport.createBidirectionalStream().then(stream => {
        const decoderStream = (0, engine_io_parser_1.createPacketDecoderStream)(Number.MAX_SAFE_INTEGER, this.socket.binaryType);
        const reader = stream.readable.pipeThrough(decoderStream).getReader();
        const encoderStream = (0, engine_io_parser_1.createPacketEncoderStream)();
        encoderStream.readable.pipeTo(stream.writable);
        this._writer = encoderStream.writable.getWriter();
        const read = () => {
          reader.read().then(({
            done,
            value
          }) => {
            if (done) {
              debug("session is closed");
              return;
            }
            debug("received chunk: %o", value);
            this.onPacket(value);
            read();
          }).catch(err => {
            debug("an error occurred while reading: %s", err);
          });
        };
        read();
        const packet = {
          type: "open"
        };
        if (this.query.sid) {
          packet.data = `{"sid":"${this.query.sid}"}`;
        }
        this._writer.write(packet).then(() => this.onOpen());
      });
    });
  }
  write(packets) {
    this.writable = false;
    for (let i = 0; i < packets.length; i++) {
      const packet = packets[i];
      const lastPacket = i === packets.length - 1;
      this._writer.write(packet).then(() => {
        if (lastPacket) {
          (0, globals_node_js_1.nextTick)(() => {
            this.writable = true;
            this.emitReserved("drain");
          }, this.setTimeoutFn);
        }
      });
    }
  }
  doClose() {
    var _a;
    (_a = this._transport) === null || _a === void 0 ? void 0 : _a.close();
  }
}
exports.WT = WT;

},{"../globals.node.js":6,"../transport.js":9,"debug":17,"engine.io-parser":23}],16:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.pick = pick;
exports.installTimerFunctions = installTimerFunctions;
exports.byteLength = byteLength;
exports.randomString = randomString;
const globals_node_js_1 = require("./globals.node.js");
function pick(obj, ...attr) {
  return attr.reduce((acc, k) => {
    if (obj.hasOwnProperty(k)) {
      acc[k] = obj[k];
    }
    return acc;
  }, {});
}
// Keep a reference to the real timeout functions so they can be used when overridden
const NATIVE_SET_TIMEOUT = globals_node_js_1.globalThisShim.setTimeout;
const NATIVE_CLEAR_TIMEOUT = globals_node_js_1.globalThisShim.clearTimeout;
function installTimerFunctions(obj, opts) {
  if (opts.useNativeTimers) {
    obj.setTimeoutFn = NATIVE_SET_TIMEOUT.bind(globals_node_js_1.globalThisShim);
    obj.clearTimeoutFn = NATIVE_CLEAR_TIMEOUT.bind(globals_node_js_1.globalThisShim);
  } else {
    obj.setTimeoutFn = globals_node_js_1.globalThisShim.setTimeout.bind(globals_node_js_1.globalThisShim);
    obj.clearTimeoutFn = globals_node_js_1.globalThisShim.clearTimeout.bind(globals_node_js_1.globalThisShim);
  }
}
// base64 encoded buffers are about 33% bigger (https://en.wikipedia.org/wiki/Base64)
const BASE64_OVERHEAD = 1.33;
// we could also have used `new Blob([obj]).size`, but it isn't supported in IE9
function byteLength(obj) {
  if (typeof obj === "string") {
    return utf8Length(obj);
  }
  // arraybuffer or blob
  return Math.ceil((obj.byteLength || obj.size) * BASE64_OVERHEAD);
}
function utf8Length(str) {
  let c = 0,
    length = 0;
  for (let i = 0, l = str.length; i < l; i++) {
    c = str.charCodeAt(i);
    if (c < 0x80) {
      length += 1;
    } else if (c < 0x800) {
      length += 2;
    } else if (c < 0xd800 || c >= 0xe000) {
      length += 3;
    } else {
      i++;
      length += 4;
    }
  }
  return length;
}
/**
 * Generates a random 8-characters string.
 */
function randomString() {
  return Date.now().toString(36).substring(3) + Math.random().toString(36).substring(2, 5);
}

},{"./globals.node.js":6}],17:[function(require,module,exports){
(function (process){(function (){
"use strict";

/* eslint-env browser */

/**
 * This is the web browser implementation of `debug()`.
 */

exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = localstorage();
exports.destroy = (() => {
  let warned = false;
  return () => {
    if (!warned) {
      warned = true;
      console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
    }
  };
})();

/**
 * Colors.
 */

exports.colors = ['#0000CC', '#0000FF', '#0033CC', '#0033FF', '#0066CC', '#0066FF', '#0099CC', '#0099FF', '#00CC00', '#00CC33', '#00CC66', '#00CC99', '#00CCCC', '#00CCFF', '#3300CC', '#3300FF', '#3333CC', '#3333FF', '#3366CC', '#3366FF', '#3399CC', '#3399FF', '#33CC00', '#33CC33', '#33CC66', '#33CC99', '#33CCCC', '#33CCFF', '#6600CC', '#6600FF', '#6633CC', '#6633FF', '#66CC00', '#66CC33', '#9900CC', '#9900FF', '#9933CC', '#9933FF', '#99CC00', '#99CC33', '#CC0000', '#CC0033', '#CC0066', '#CC0099', '#CC00CC', '#CC00FF', '#CC3300', '#CC3333', '#CC3366', '#CC3399', '#CC33CC', '#CC33FF', '#CC6600', '#CC6633', '#CC9900', '#CC9933', '#CCCC00', '#CCCC33', '#FF0000', '#FF0033', '#FF0066', '#FF0099', '#FF00CC', '#FF00FF', '#FF3300', '#FF3333', '#FF3366', '#FF3399', '#FF33CC', '#FF33FF', '#FF6600', '#FF6633', '#FF9900', '#FF9933', '#FFCC00', '#FFCC33'];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

// eslint-disable-next-line complexity
function useColors() {
  // NB: In an Electron preload script, document will be defined but not fully
  // initialized. Since we know we're in Chrome, we'll just detect this case
  // explicitly
  if (typeof window !== 'undefined' && window.process && (window.process.type === 'renderer' || window.process.__nwjs)) {
    return true;
  }

  // Internet Explorer and Edge do not support colors.
  if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
    return false;
  }
  let m;

  // Is webkit? http://stackoverflow.com/a/16459606/376773
  // document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
  return typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance ||
  // Is firebug? http://stackoverflow.com/a/398120/376773
  typeof window !== 'undefined' && window.console && (window.console.firebug || window.console.exception && window.console.table) ||
  // Is firefox >= v31?
  // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
  typeof navigator !== 'undefined' && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31 ||
  // Double check webkit in userAgent just in case we are in a worker
  typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
}

/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs(args) {
  args[0] = (this.useColors ? '%c' : '') + this.namespace + (this.useColors ? ' %c' : ' ') + args[0] + (this.useColors ? '%c ' : ' ') + '+' + module.exports.humanize(this.diff);
  if (!this.useColors) {
    return;
  }
  const c = 'color: ' + this.color;
  args.splice(1, 0, c, 'color: inherit');

  // The final "%c" is somewhat tricky, because there could be other
  // arguments passed either before or after the %c, so we need to
  // figure out the correct index to insert the CSS into
  let index = 0;
  let lastC = 0;
  args[0].replace(/%[a-zA-Z%]/g, match => {
    if (match === '%%') {
      return;
    }
    index++;
    if (match === '%c') {
      // We only are interested in the *last* %c
      // (the user may have provided their own)
      lastC = index;
    }
  });
  args.splice(lastC, 0, c);
}

/**
 * Invokes `console.debug()` when available.
 * No-op when `console.debug` is not a "function".
 * If `console.debug` is not available, falls back
 * to `console.log`.
 *
 * @api public
 */
exports.log = console.debug || console.log || (() => {});

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */
function save(namespaces) {
  try {
    if (namespaces) {
      exports.storage.setItem('debug', namespaces);
    } else {
      exports.storage.removeItem('debug');
    }
  } catch (error) {
    // Swallow
    // XXX (@Qix-) should we be logging these?
  }
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */
function load() {
  let r;
  try {
    r = exports.storage.getItem('debug');
  } catch (error) {
    // Swallow
    // XXX (@Qix-) should we be logging these?
  }

  // If debug isn't set in LS, and we're in Electron, try to load $DEBUG
  if (!r && typeof process !== 'undefined' && 'env' in process) {
    r = process.env.DEBUG;
  }
  return r;
}

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage() {
  try {
    // TVMLKit (Apple TV JS Runtime) does not have a window object, just localStorage in the global context
    // The Browser also has localStorage in the global context.
    return localStorage;
  } catch (error) {
    // Swallow
    // XXX (@Qix-) should we be logging these?
  }
}
module.exports = require('./common')(exports);
const {
  formatters
} = module.exports;

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

formatters.j = function (v) {
  try {
    return JSON.stringify(v);
  } catch (error) {
    return '[UnexpectedJSONParseError]: ' + error.message;
  }
};

}).call(this)}).call(this,require('_process'))
},{"./common":18,"_process":25}],18:[function(require,module,exports){
"use strict";

/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 */

function setup(env) {
  createDebug.debug = createDebug;
  createDebug.default = createDebug;
  createDebug.coerce = coerce;
  createDebug.disable = disable;
  createDebug.enable = enable;
  createDebug.enabled = enabled;
  createDebug.humanize = require('ms');
  createDebug.destroy = destroy;
  Object.keys(env).forEach(key => {
    createDebug[key] = env[key];
  });

  /**
  * The currently active debug mode names, and names to skip.
  */

  createDebug.names = [];
  createDebug.skips = [];

  /**
  * Map of special "%n" handling functions, for the debug "format" argument.
  *
  * Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
  */
  createDebug.formatters = {};

  /**
  * Selects a color for a debug namespace
  * @param {String} namespace The namespace string for the debug instance to be colored
  * @return {Number|String} An ANSI color code for the given namespace
  * @api private
  */
  function selectColor(namespace) {
    let hash = 0;
    for (let i = 0; i < namespace.length; i++) {
      hash = (hash << 5) - hash + namespace.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
  }
  createDebug.selectColor = selectColor;

  /**
  * Create a debugger with the given `namespace`.
  *
  * @param {String} namespace
  * @return {Function}
  * @api public
  */
  function createDebug(namespace) {
    let prevTime;
    let enableOverride = null;
    let namespacesCache;
    let enabledCache;
    function debug(...args) {
      // Disabled?
      if (!debug.enabled) {
        return;
      }
      const self = debug;

      // Set `diff` timestamp
      const curr = Number(new Date());
      const ms = curr - (prevTime || curr);
      self.diff = ms;
      self.prev = prevTime;
      self.curr = curr;
      prevTime = curr;
      args[0] = createDebug.coerce(args[0]);
      if (typeof args[0] !== 'string') {
        // Anything else let's inspect with %O
        args.unshift('%O');
      }

      // Apply any `formatters` transformations
      let index = 0;
      args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
        // If we encounter an escaped % then don't increase the array index
        if (match === '%%') {
          return '%';
        }
        index++;
        const formatter = createDebug.formatters[format];
        if (typeof formatter === 'function') {
          const val = args[index];
          match = formatter.call(self, val);

          // Now we need to remove `args[index]` since it's inlined in the `format`
          args.splice(index, 1);
          index--;
        }
        return match;
      });

      // Apply env-specific formatting (colors, etc.)
      createDebug.formatArgs.call(self, args);
      const logFn = self.log || createDebug.log;
      logFn.apply(self, args);
    }
    debug.namespace = namespace;
    debug.useColors = createDebug.useColors();
    debug.color = createDebug.selectColor(namespace);
    debug.extend = extend;
    debug.destroy = createDebug.destroy; // XXX Temporary. Will be removed in the next major release.

    Object.defineProperty(debug, 'enabled', {
      enumerable: true,
      configurable: false,
      get: () => {
        if (enableOverride !== null) {
          return enableOverride;
        }
        if (namespacesCache !== createDebug.namespaces) {
          namespacesCache = createDebug.namespaces;
          enabledCache = createDebug.enabled(namespace);
        }
        return enabledCache;
      },
      set: v => {
        enableOverride = v;
      }
    });

    // Env-specific initialization logic for debug instances
    if (typeof createDebug.init === 'function') {
      createDebug.init(debug);
    }
    return debug;
  }
  function extend(namespace, delimiter) {
    const newDebug = createDebug(this.namespace + (typeof delimiter === 'undefined' ? ':' : delimiter) + namespace);
    newDebug.log = this.log;
    return newDebug;
  }

  /**
  * Enables a debug mode by namespaces. This can include modes
  * separated by a colon and wildcards.
  *
  * @param {String} namespaces
  * @api public
  */
  function enable(namespaces) {
    createDebug.save(namespaces);
    createDebug.namespaces = namespaces;
    createDebug.names = [];
    createDebug.skips = [];
    let i;
    const split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
    const len = split.length;
    for (i = 0; i < len; i++) {
      if (!split[i]) {
        // ignore empty strings
        continue;
      }
      namespaces = split[i].replace(/\*/g, '.*?');
      if (namespaces[0] === '-') {
        createDebug.skips.push(new RegExp('^' + namespaces.slice(1) + '$'));
      } else {
        createDebug.names.push(new RegExp('^' + namespaces + '$'));
      }
    }
  }

  /**
  * Disable debug output.
  *
  * @return {String} namespaces
  * @api public
  */
  function disable() {
    const namespaces = [...createDebug.names.map(toNamespace), ...createDebug.skips.map(toNamespace).map(namespace => '-' + namespace)].join(',');
    createDebug.enable('');
    return namespaces;
  }

  /**
  * Returns true if the given mode name is enabled, false otherwise.
  *
  * @param {String} name
  * @return {Boolean}
  * @api public
  */
  function enabled(name) {
    if (name[name.length - 1] === '*') {
      return true;
    }
    let i;
    let len;
    for (i = 0, len = createDebug.skips.length; i < len; i++) {
      if (createDebug.skips[i].test(name)) {
        return false;
      }
    }
    for (i = 0, len = createDebug.names.length; i < len; i++) {
      if (createDebug.names[i].test(name)) {
        return true;
      }
    }
    return false;
  }

  /**
  * Convert regexp to namespace
  *
  * @param {RegExp} regxep
  * @return {String} namespace
  * @api private
  */
  function toNamespace(regexp) {
    return regexp.toString().substring(2, regexp.toString().length - 2).replace(/\.\*\?$/, '*');
  }

  /**
  * Coerce `val`.
  *
  * @param {Mixed} val
  * @return {Mixed}
  * @api private
  */
  function coerce(val) {
    if (val instanceof Error) {
      return val.stack || val.message;
    }
    return val;
  }

  /**
  * XXX DO NOT USE. This is a temporary stub function.
  * XXX It WILL be removed in the next major release.
  */
  function destroy() {
    console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
  }
  createDebug.enable(createDebug.load());
  return createDebug;
}
module.exports = setup;

},{"ms":24}],19:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ERROR_PACKET = exports.PACKET_TYPES_REVERSE = exports.PACKET_TYPES = void 0;
const PACKET_TYPES = Object.create(null); // no Map = no polyfill
exports.PACKET_TYPES = PACKET_TYPES;
PACKET_TYPES["open"] = "0";
PACKET_TYPES["close"] = "1";
PACKET_TYPES["ping"] = "2";
PACKET_TYPES["pong"] = "3";
PACKET_TYPES["message"] = "4";
PACKET_TYPES["upgrade"] = "5";
PACKET_TYPES["noop"] = "6";
const PACKET_TYPES_REVERSE = Object.create(null);
exports.PACKET_TYPES_REVERSE = PACKET_TYPES_REVERSE;
Object.keys(PACKET_TYPES).forEach(key => {
  PACKET_TYPES_REVERSE[PACKET_TYPES[key]] = key;
});
const ERROR_PACKET = {
  type: "error",
  data: "parser error"
};
exports.ERROR_PACKET = ERROR_PACKET;

},{}],20:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.decode = exports.encode = void 0;
// imported from https://github.com/socketio/base64-arraybuffer
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
// Use a lookup table to find the index.
const lookup = typeof Uint8Array === 'undefined' ? [] : new Uint8Array(256);
for (let i = 0; i < chars.length; i++) {
  lookup[chars.charCodeAt(i)] = i;
}
const encode = arraybuffer => {
  let bytes = new Uint8Array(arraybuffer),
    i,
    len = bytes.length,
    base64 = '';
  for (i = 0; i < len; i += 3) {
    base64 += chars[bytes[i] >> 2];
    base64 += chars[(bytes[i] & 3) << 4 | bytes[i + 1] >> 4];
    base64 += chars[(bytes[i + 1] & 15) << 2 | bytes[i + 2] >> 6];
    base64 += chars[bytes[i + 2] & 63];
  }
  if (len % 3 === 2) {
    base64 = base64.substring(0, base64.length - 1) + '=';
  } else if (len % 3 === 1) {
    base64 = base64.substring(0, base64.length - 2) + '==';
  }
  return base64;
};
exports.encode = encode;
const decode = base64 => {
  let bufferLength = base64.length * 0.75,
    len = base64.length,
    i,
    p = 0,
    encoded1,
    encoded2,
    encoded3,
    encoded4;
  if (base64[base64.length - 1] === '=') {
    bufferLength--;
    if (base64[base64.length - 2] === '=') {
      bufferLength--;
    }
  }
  const arraybuffer = new ArrayBuffer(bufferLength),
    bytes = new Uint8Array(arraybuffer);
  for (i = 0; i < len; i += 4) {
    encoded1 = lookup[base64.charCodeAt(i)];
    encoded2 = lookup[base64.charCodeAt(i + 1)];
    encoded3 = lookup[base64.charCodeAt(i + 2)];
    encoded4 = lookup[base64.charCodeAt(i + 3)];
    bytes[p++] = encoded1 << 2 | encoded2 >> 4;
    bytes[p++] = (encoded2 & 15) << 4 | encoded3 >> 2;
    bytes[p++] = (encoded3 & 3) << 6 | encoded4 & 63;
  }
  return arraybuffer;
};
exports.decode = decode;

},{}],21:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.decodePacket = void 0;
const commons_js_1 = require("./commons.js");
const base64_arraybuffer_js_1 = require("./contrib/base64-arraybuffer.js");
const withNativeArrayBuffer = typeof ArrayBuffer === "function";
const decodePacket = (encodedPacket, binaryType) => {
  if (typeof encodedPacket !== "string") {
    return {
      type: "message",
      data: mapBinary(encodedPacket, binaryType)
    };
  }
  const type = encodedPacket.charAt(0);
  if (type === "b") {
    return {
      type: "message",
      data: decodeBase64Packet(encodedPacket.substring(1), binaryType)
    };
  }
  const packetType = commons_js_1.PACKET_TYPES_REVERSE[type];
  if (!packetType) {
    return commons_js_1.ERROR_PACKET;
  }
  return encodedPacket.length > 1 ? {
    type: commons_js_1.PACKET_TYPES_REVERSE[type],
    data: encodedPacket.substring(1)
  } : {
    type: commons_js_1.PACKET_TYPES_REVERSE[type]
  };
};
exports.decodePacket = decodePacket;
const decodeBase64Packet = (data, binaryType) => {
  if (withNativeArrayBuffer) {
    const decoded = (0, base64_arraybuffer_js_1.decode)(data);
    return mapBinary(decoded, binaryType);
  } else {
    return {
      base64: true,
      data
    }; // fallback for old browsers
  }
};
const mapBinary = (data, binaryType) => {
  switch (binaryType) {
    case "blob":
      if (data instanceof Blob) {
        // from WebSocket + binaryType "blob"
        return data;
      } else {
        // from HTTP long-polling or WebTransport
        return new Blob([data]);
      }
    case "arraybuffer":
    default:
      if (data instanceof ArrayBuffer) {
        // from HTTP long-polling (base64) or WebSocket + binaryType "arraybuffer"
        return data;
      } else {
        // from WebTransport (Uint8Array)
        return data.buffer;
      }
  }
};

},{"./commons.js":19,"./contrib/base64-arraybuffer.js":20}],22:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.encodePacket = void 0;
exports.encodePacketToBinary = encodePacketToBinary;
const commons_js_1 = require("./commons.js");
const withNativeBlob = typeof Blob === "function" || typeof Blob !== "undefined" && Object.prototype.toString.call(Blob) === "[object BlobConstructor]";
const withNativeArrayBuffer = typeof ArrayBuffer === "function";
// ArrayBuffer.isView method is not defined in IE10
const isView = obj => {
  return typeof ArrayBuffer.isView === "function" ? ArrayBuffer.isView(obj) : obj && obj.buffer instanceof ArrayBuffer;
};
const encodePacket = ({
  type,
  data
}, supportsBinary, callback) => {
  if (withNativeBlob && data instanceof Blob) {
    if (supportsBinary) {
      return callback(data);
    } else {
      return encodeBlobAsBase64(data, callback);
    }
  } else if (withNativeArrayBuffer && (data instanceof ArrayBuffer || isView(data))) {
    if (supportsBinary) {
      return callback(data);
    } else {
      return encodeBlobAsBase64(new Blob([data]), callback);
    }
  }
  // plain string
  return callback(commons_js_1.PACKET_TYPES[type] + (data || ""));
};
exports.encodePacket = encodePacket;
const encodeBlobAsBase64 = (data, callback) => {
  const fileReader = new FileReader();
  fileReader.onload = function () {
    const content = fileReader.result.split(",")[1];
    callback("b" + (content || ""));
  };
  return fileReader.readAsDataURL(data);
};
function toArray(data) {
  if (data instanceof Uint8Array) {
    return data;
  } else if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  } else {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  }
}
let TEXT_ENCODER;
function encodePacketToBinary(packet, callback) {
  if (withNativeBlob && packet.data instanceof Blob) {
    return packet.data.arrayBuffer().then(toArray).then(callback);
  } else if (withNativeArrayBuffer && (packet.data instanceof ArrayBuffer || isView(packet.data))) {
    return callback(toArray(packet.data));
  }
  encodePacket(packet, false, encoded => {
    if (!TEXT_ENCODER) {
      TEXT_ENCODER = new TextEncoder();
    }
    callback(TEXT_ENCODER.encode(encoded));
  });
}

},{"./commons.js":19}],23:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.decodePayload = exports.decodePacket = exports.encodePayload = exports.encodePacket = exports.protocol = void 0;
exports.createPacketEncoderStream = createPacketEncoderStream;
exports.createPacketDecoderStream = createPacketDecoderStream;
const encodePacket_js_1 = require("./encodePacket.js");
Object.defineProperty(exports, "encodePacket", {
  enumerable: true,
  get: function () {
    return encodePacket_js_1.encodePacket;
  }
});
const decodePacket_js_1 = require("./decodePacket.js");
Object.defineProperty(exports, "decodePacket", {
  enumerable: true,
  get: function () {
    return decodePacket_js_1.decodePacket;
  }
});
const commons_js_1 = require("./commons.js");
const SEPARATOR = String.fromCharCode(30); // see https://en.wikipedia.org/wiki/Delimiter#ASCII_delimited_text
const encodePayload = (packets, callback) => {
  // some packets may be added to the array while encoding, so the initial length must be saved
  const length = packets.length;
  const encodedPackets = new Array(length);
  let count = 0;
  packets.forEach((packet, i) => {
    // force base64 encoding for binary packets
    (0, encodePacket_js_1.encodePacket)(packet, false, encodedPacket => {
      encodedPackets[i] = encodedPacket;
      if (++count === length) {
        callback(encodedPackets.join(SEPARATOR));
      }
    });
  });
};
exports.encodePayload = encodePayload;
const decodePayload = (encodedPayload, binaryType) => {
  const encodedPackets = encodedPayload.split(SEPARATOR);
  const packets = [];
  for (let i = 0; i < encodedPackets.length; i++) {
    const decodedPacket = (0, decodePacket_js_1.decodePacket)(encodedPackets[i], binaryType);
    packets.push(decodedPacket);
    if (decodedPacket.type === "error") {
      break;
    }
  }
  return packets;
};
exports.decodePayload = decodePayload;
function createPacketEncoderStream() {
  return new TransformStream({
    transform(packet, controller) {
      (0, encodePacket_js_1.encodePacketToBinary)(packet, encodedPacket => {
        const payloadLength = encodedPacket.length;
        let header;
        // inspired by the WebSocket format: https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers#decoding_payload_length
        if (payloadLength < 126) {
          header = new Uint8Array(1);
          new DataView(header.buffer).setUint8(0, payloadLength);
        } else if (payloadLength < 65536) {
          header = new Uint8Array(3);
          const view = new DataView(header.buffer);
          view.setUint8(0, 126);
          view.setUint16(1, payloadLength);
        } else {
          header = new Uint8Array(9);
          const view = new DataView(header.buffer);
          view.setUint8(0, 127);
          view.setBigUint64(1, BigInt(payloadLength));
        }
        // first bit indicates whether the payload is plain text (0) or binary (1)
        if (packet.data && typeof packet.data !== "string") {
          header[0] |= 0x80;
        }
        controller.enqueue(header);
        controller.enqueue(encodedPacket);
      });
    }
  });
}
let TEXT_DECODER;
function totalLength(chunks) {
  return chunks.reduce((acc, chunk) => acc + chunk.length, 0);
}
function concatChunks(chunks, size) {
  if (chunks[0].length === size) {
    return chunks.shift();
  }
  const buffer = new Uint8Array(size);
  let j = 0;
  for (let i = 0; i < size; i++) {
    buffer[i] = chunks[0][j++];
    if (j === chunks[0].length) {
      chunks.shift();
      j = 0;
    }
  }
  if (chunks.length && j < chunks[0].length) {
    chunks[0] = chunks[0].slice(j);
  }
  return buffer;
}
function createPacketDecoderStream(maxPayload, binaryType) {
  if (!TEXT_DECODER) {
    TEXT_DECODER = new TextDecoder();
  }
  const chunks = [];
  let state = 0 /* State.READ_HEADER */;
  let expectedLength = -1;
  let isBinary = false;
  return new TransformStream({
    transform(chunk, controller) {
      chunks.push(chunk);
      while (true) {
        if (state === 0 /* State.READ_HEADER */) {
          if (totalLength(chunks) < 1) {
            break;
          }
          const header = concatChunks(chunks, 1);
          isBinary = (header[0] & 0x80) === 0x80;
          expectedLength = header[0] & 0x7f;
          if (expectedLength < 126) {
            state = 3 /* State.READ_PAYLOAD */;
          } else if (expectedLength === 126) {
            state = 1 /* State.READ_EXTENDED_LENGTH_16 */;
          } else {
            state = 2 /* State.READ_EXTENDED_LENGTH_64 */;
          }
        } else if (state === 1 /* State.READ_EXTENDED_LENGTH_16 */) {
          if (totalLength(chunks) < 2) {
            break;
          }
          const headerArray = concatChunks(chunks, 2);
          expectedLength = new DataView(headerArray.buffer, headerArray.byteOffset, headerArray.length).getUint16(0);
          state = 3 /* State.READ_PAYLOAD */;
        } else if (state === 2 /* State.READ_EXTENDED_LENGTH_64 */) {
          if (totalLength(chunks) < 8) {
            break;
          }
          const headerArray = concatChunks(chunks, 8);
          const view = new DataView(headerArray.buffer, headerArray.byteOffset, headerArray.length);
          const n = view.getUint32(0);
          if (n > Math.pow(2, 53 - 32) - 1) {
            // the maximum safe integer in JavaScript is 2^53 - 1
            controller.enqueue(commons_js_1.ERROR_PACKET);
            break;
          }
          expectedLength = n * Math.pow(2, 32) + view.getUint32(4);
          state = 3 /* State.READ_PAYLOAD */;
        } else {
          if (totalLength(chunks) < expectedLength) {
            break;
          }
          const data = concatChunks(chunks, expectedLength);
          controller.enqueue((0, decodePacket_js_1.decodePacket)(isBinary ? data : TEXT_DECODER.decode(data), binaryType));
          state = 0 /* State.READ_HEADER */;
        }
        if (expectedLength === 0 || expectedLength > maxPayload) {
          controller.enqueue(commons_js_1.ERROR_PACKET);
          break;
        }
      }
    }
  });
}
exports.protocol = 4;

},{"./commons.js":19,"./decodePacket.js":21,"./encodePacket.js":22}],24:[function(require,module,exports){
"use strict";

/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var w = d * 7;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} [options]
 * @throws {Error} throw an error if val is not a non-empty string or a number
 * @return {String|Number}
 * @api public
 */

module.exports = function (val, options) {
  options = options || {};
  var type = typeof val;
  if (type === 'string' && val.length > 0) {
    return parse(val);
  } else if (type === 'number' && isFinite(val)) {
    return options.long ? fmtLong(val) : fmtShort(val);
  }
  throw new Error('val is not a non-empty string or a valid number. val=' + JSON.stringify(val));
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = String(str);
  if (str.length > 100) {
    return;
  }
  var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(str);
  if (!match) {
    return;
  }
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'weeks':
    case 'week':
    case 'w':
      return n * w;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
    default:
      return undefined;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtShort(ms) {
  var msAbs = Math.abs(ms);
  if (msAbs >= d) {
    return Math.round(ms / d) + 'd';
  }
  if (msAbs >= h) {
    return Math.round(ms / h) + 'h';
  }
  if (msAbs >= m) {
    return Math.round(ms / m) + 'm';
  }
  if (msAbs >= s) {
    return Math.round(ms / s) + 's';
  }
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtLong(ms) {
  var msAbs = Math.abs(ms);
  if (msAbs >= d) {
    return plural(ms, msAbs, d, 'day');
  }
  if (msAbs >= h) {
    return plural(ms, msAbs, h, 'hour');
  }
  if (msAbs >= m) {
    return plural(ms, msAbs, m, 'minute');
  }
  if (msAbs >= s) {
    return plural(ms, msAbs, s, 'second');
  }
  return ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, msAbs, n, name) {
  var isPlural = msAbs >= n * 1.5;
  return Math.round(ms / n) + ' ' + name + (isPlural ? 's' : '');
}

},{}],25:[function(require,module,exports){
"use strict";

// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;
function defaultSetTimout() {
  throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout() {
  throw new Error('clearTimeout has not been defined');
}
(function () {
  try {
    if (typeof setTimeout === 'function') {
      cachedSetTimeout = setTimeout;
    } else {
      cachedSetTimeout = defaultSetTimout;
    }
  } catch (e) {
    cachedSetTimeout = defaultSetTimout;
  }
  try {
    if (typeof clearTimeout === 'function') {
      cachedClearTimeout = clearTimeout;
    } else {
      cachedClearTimeout = defaultClearTimeout;
    }
  } catch (e) {
    cachedClearTimeout = defaultClearTimeout;
  }
})();
function runTimeout(fun) {
  if (cachedSetTimeout === setTimeout) {
    //normal enviroments in sane situations
    return setTimeout(fun, 0);
  }
  // if setTimeout wasn't available but was latter defined
  if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
    cachedSetTimeout = setTimeout;
    return setTimeout(fun, 0);
  }
  try {
    // when when somebody has screwed with setTimeout but no I.E. maddness
    return cachedSetTimeout(fun, 0);
  } catch (e) {
    try {
      // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
      return cachedSetTimeout.call(null, fun, 0);
    } catch (e) {
      // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
      return cachedSetTimeout.call(this, fun, 0);
    }
  }
}
function runClearTimeout(marker) {
  if (cachedClearTimeout === clearTimeout) {
    //normal enviroments in sane situations
    return clearTimeout(marker);
  }
  // if clearTimeout wasn't available but was latter defined
  if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
    cachedClearTimeout = clearTimeout;
    return clearTimeout(marker);
  }
  try {
    // when when somebody has screwed with setTimeout but no I.E. maddness
    return cachedClearTimeout(marker);
  } catch (e) {
    try {
      // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
      return cachedClearTimeout.call(null, marker);
    } catch (e) {
      // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
      // Some versions of I.E. have different rules for clearTimeout vs setTimeout
      return cachedClearTimeout.call(this, marker);
    }
  }
}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;
function cleanUpNextTick() {
  if (!draining || !currentQueue) {
    return;
  }
  draining = false;
  if (currentQueue.length) {
    queue = currentQueue.concat(queue);
  } else {
    queueIndex = -1;
  }
  if (queue.length) {
    drainQueue();
  }
}
function drainQueue() {
  if (draining) {
    return;
  }
  var timeout = runTimeout(cleanUpNextTick);
  draining = true;
  var len = queue.length;
  while (len) {
    currentQueue = queue;
    queue = [];
    while (++queueIndex < len) {
      if (currentQueue) {
        currentQueue[queueIndex].run();
      }
    }
    queueIndex = -1;
    len = queue.length;
  }
  currentQueue = null;
  draining = false;
  runClearTimeout(timeout);
}
process.nextTick = function (fun) {
  var args = new Array(arguments.length - 1);
  if (arguments.length > 1) {
    for (var i = 1; i < arguments.length; i++) {
      args[i - 1] = arguments[i];
    }
  }
  queue.push(new Item(fun, args));
  if (queue.length === 1 && !draining) {
    runTimeout(drainQueue);
  }
};

// v8 likes predictible objects
function Item(fun, array) {
  this.fun = fun;
  this.array = array;
}
Item.prototype.run = function () {
  this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};
function noop() {}
process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;
process.listeners = function (name) {
  return [];
};
process.binding = function (name) {
  throw new Error('process.binding is not supported');
};
process.cwd = function () {
  return '/';
};
process.chdir = function (dir) {
  throw new Error('process.chdir is not supported');
};
process.umask = function () {
  return 0;
};

},{}],26:[function(require,module,exports){
"use strict";

/**
 * Initialize backoff timer with `opts`.
 *
 * - `min` initial timeout in milliseconds [100]
 * - `max` max timeout [10000]
 * - `jitter` [0]
 * - `factor` [2]
 *
 * @param {Object} opts
 * @api public
 */
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Backoff = Backoff;
function Backoff(opts) {
  opts = opts || {};
  this.ms = opts.min || 100;
  this.max = opts.max || 10000;
  this.factor = opts.factor || 2;
  this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
  this.attempts = 0;
}
/**
 * Return the backoff duration.
 *
 * @return {Number}
 * @api public
 */
Backoff.prototype.duration = function () {
  var ms = this.ms * Math.pow(this.factor, this.attempts++);
  if (this.jitter) {
    var rand = Math.random();
    var deviation = Math.floor(rand * this.jitter * ms);
    ms = (Math.floor(rand * 10) & 1) == 0 ? ms - deviation : ms + deviation;
  }
  return Math.min(ms, this.max) | 0;
};
/**
 * Reset the number of attempts.
 *
 * @api public
 */
Backoff.prototype.reset = function () {
  this.attempts = 0;
};
/**
 * Set the minimum duration
 *
 * @api public
 */
Backoff.prototype.setMin = function (min) {
  this.ms = min;
};
/**
 * Set the maximum duration
 *
 * @api public
 */
Backoff.prototype.setMax = function (max) {
  this.max = max;
};
/**
 * Set the jitter
 *
 * @api public
 */
Backoff.prototype.setJitter = function (jitter) {
  this.jitter = jitter;
};

},{}],27:[function(require,module,exports){
"use strict";

var __importDefault = void 0 && (void 0).__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WebTransport = exports.WebSocket = exports.NodeWebSocket = exports.XHR = exports.NodeXHR = exports.Fetch = exports.Socket = exports.Manager = exports.protocol = void 0;
exports.io = lookup;
exports.connect = lookup;
exports.default = lookup;
const url_js_1 = require("./url.js");
const manager_js_1 = require("./manager.js");
Object.defineProperty(exports, "Manager", {
  enumerable: true,
  get: function () {
    return manager_js_1.Manager;
  }
});
const socket_js_1 = require("./socket.js");
Object.defineProperty(exports, "Socket", {
  enumerable: true,
  get: function () {
    return socket_js_1.Socket;
  }
});
const debug_1 = __importDefault(require("debug")); // debug()
const debug = (0, debug_1.default)("socket.io-client"); // debug()
/**
 * Managers cache.
 */
const cache = {};
function lookup(uri, opts) {
  if (typeof uri === "object") {
    opts = uri;
    uri = undefined;
  }
  opts = opts || {};
  const parsed = (0, url_js_1.url)(uri, opts.path || "/socket.io");
  const source = parsed.source;
  const id = parsed.id;
  const path = parsed.path;
  const sameNamespace = cache[id] && path in cache[id]["nsps"];
  const newConnection = opts.forceNew || opts["force new connection"] || false === opts.multiplex || sameNamespace;
  let io;
  if (newConnection) {
    debug("ignoring socket cache for %s", source);
    io = new manager_js_1.Manager(source, opts);
  } else {
    if (!cache[id]) {
      debug("new io instance for %s", source);
      cache[id] = new manager_js_1.Manager(source, opts);
    }
    io = cache[id];
  }
  if (parsed.query && !opts.query) {
    opts.query = parsed.queryKey;
  }
  return io.socket(parsed.path, opts);
}
// so that "lookup" can be used both as a function (e.g. `io(...)`) and as a
// namespace (e.g. `io.connect(...)`), for backward compatibility
Object.assign(lookup, {
  Manager: manager_js_1.Manager,
  Socket: socket_js_1.Socket,
  io: lookup,
  connect: lookup
});
/**
 * Protocol version.
 *
 * @public
 */
var socket_io_parser_1 = require("socket.io-parser");
Object.defineProperty(exports, "protocol", {
  enumerable: true,
  get: function () {
    return socket_io_parser_1.protocol;
  }
});
var engine_io_client_1 = require("engine.io-client");
Object.defineProperty(exports, "Fetch", {
  enumerable: true,
  get: function () {
    return engine_io_client_1.Fetch;
  }
});
Object.defineProperty(exports, "NodeXHR", {
  enumerable: true,
  get: function () {
    return engine_io_client_1.NodeXHR;
  }
});
Object.defineProperty(exports, "XHR", {
  enumerable: true,
  get: function () {
    return engine_io_client_1.XHR;
  }
});
Object.defineProperty(exports, "NodeWebSocket", {
  enumerable: true,
  get: function () {
    return engine_io_client_1.NodeWebSocket;
  }
});
Object.defineProperty(exports, "WebSocket", {
  enumerable: true,
  get: function () {
    return engine_io_client_1.WebSocket;
  }
});
Object.defineProperty(exports, "WebTransport", {
  enumerable: true,
  get: function () {
    return engine_io_client_1.WebTransport;
  }
});
module.exports = lookup;

},{"./manager.js":28,"./socket.js":30,"./url.js":31,"debug":32,"engine.io-client":7,"socket.io-parser":35}],28:[function(require,module,exports){
"use strict";

var __createBinding = void 0 && (void 0).__createBinding || (Object.create ? function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  var desc = Object.getOwnPropertyDescriptor(m, k);
  if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
    desc = {
      enumerable: true,
      get: function () {
        return m[k];
      }
    };
  }
  Object.defineProperty(o, k2, desc);
} : function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  o[k2] = m[k];
});
var __setModuleDefault = void 0 && (void 0).__setModuleDefault || (Object.create ? function (o, v) {
  Object.defineProperty(o, "default", {
    enumerable: true,
    value: v
  });
} : function (o, v) {
  o["default"] = v;
});
var __importStar = void 0 && (void 0).__importStar || function (mod) {
  if (mod && mod.__esModule) return mod;
  var result = {};
  if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
  __setModuleDefault(result, mod);
  return result;
};
var __importDefault = void 0 && (void 0).__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Manager = void 0;
const engine_io_client_1 = require("engine.io-client");
const socket_js_1 = require("./socket.js");
const parser = __importStar(require("socket.io-parser"));
const on_js_1 = require("./on.js");
const backo2_js_1 = require("./contrib/backo2.js");
const component_emitter_1 = require("@socket.io/component-emitter");
const debug_1 = __importDefault(require("debug")); // debug()
const debug = (0, debug_1.default)("socket.io-client:manager"); // debug()
class Manager extends component_emitter_1.Emitter {
  constructor(uri, opts) {
    var _a;
    super();
    this.nsps = {};
    this.subs = [];
    if (uri && "object" === typeof uri) {
      opts = uri;
      uri = undefined;
    }
    opts = opts || {};
    opts.path = opts.path || "/socket.io";
    this.opts = opts;
    (0, engine_io_client_1.installTimerFunctions)(this, opts);
    this.reconnection(opts.reconnection !== false);
    this.reconnectionAttempts(opts.reconnectionAttempts || Infinity);
    this.reconnectionDelay(opts.reconnectionDelay || 1000);
    this.reconnectionDelayMax(opts.reconnectionDelayMax || 5000);
    this.randomizationFactor((_a = opts.randomizationFactor) !== null && _a !== void 0 ? _a : 0.5);
    this.backoff = new backo2_js_1.Backoff({
      min: this.reconnectionDelay(),
      max: this.reconnectionDelayMax(),
      jitter: this.randomizationFactor()
    });
    this.timeout(null == opts.timeout ? 20000 : opts.timeout);
    this._readyState = "closed";
    this.uri = uri;
    const _parser = opts.parser || parser;
    this.encoder = new _parser.Encoder();
    this.decoder = new _parser.Decoder();
    this._autoConnect = opts.autoConnect !== false;
    if (this._autoConnect) this.open();
  }
  reconnection(v) {
    if (!arguments.length) return this._reconnection;
    this._reconnection = !!v;
    if (!v) {
      this.skipReconnect = true;
    }
    return this;
  }
  reconnectionAttempts(v) {
    if (v === undefined) return this._reconnectionAttempts;
    this._reconnectionAttempts = v;
    return this;
  }
  reconnectionDelay(v) {
    var _a;
    if (v === undefined) return this._reconnectionDelay;
    this._reconnectionDelay = v;
    (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMin(v);
    return this;
  }
  randomizationFactor(v) {
    var _a;
    if (v === undefined) return this._randomizationFactor;
    this._randomizationFactor = v;
    (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setJitter(v);
    return this;
  }
  reconnectionDelayMax(v) {
    var _a;
    if (v === undefined) return this._reconnectionDelayMax;
    this._reconnectionDelayMax = v;
    (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMax(v);
    return this;
  }
  timeout(v) {
    if (!arguments.length) return this._timeout;
    this._timeout = v;
    return this;
  }
  /**
   * Starts trying to reconnect if reconnection is enabled and we have not
   * started reconnecting yet
   *
   * @private
   */
  maybeReconnectOnOpen() {
    // Only try to reconnect if it's the first time we're connecting
    if (!this._reconnecting && this._reconnection && this.backoff.attempts === 0) {
      // keeps reconnection from firing twice for the same reconnection loop
      this.reconnect();
    }
  }
  /**
   * Sets the current transport `socket`.
   *
   * @param {Function} fn - optional, callback
   * @return self
   * @public
   */
  open(fn) {
    debug("readyState %s", this._readyState);
    if (~this._readyState.indexOf("open")) return this;
    debug("opening %s", this.uri);
    this.engine = new engine_io_client_1.Socket(this.uri, this.opts);
    const socket = this.engine;
    const self = this;
    this._readyState = "opening";
    this.skipReconnect = false;
    // emit `open`
    const openSubDestroy = (0, on_js_1.on)(socket, "open", function () {
      self.onopen();
      fn && fn();
    });
    const onError = err => {
      debug("error");
      this.cleanup();
      this._readyState = "closed";
      this.emitReserved("error", err);
      if (fn) {
        fn(err);
      } else {
        // Only do this if there is no fn to handle the error
        this.maybeReconnectOnOpen();
      }
    };
    // emit `error`
    const errorSub = (0, on_js_1.on)(socket, "error", onError);
    if (false !== this._timeout) {
      const timeout = this._timeout;
      debug("connect attempt will timeout after %d", timeout);
      // set timer
      const timer = this.setTimeoutFn(() => {
        debug("connect attempt timed out after %d", timeout);
        openSubDestroy();
        onError(new Error("timeout"));
        socket.close();
      }, timeout);
      if (this.opts.autoUnref) {
        timer.unref();
      }
      this.subs.push(() => {
        this.clearTimeoutFn(timer);
      });
    }
    this.subs.push(openSubDestroy);
    this.subs.push(errorSub);
    return this;
  }
  /**
   * Alias for open()
   *
   * @return self
   * @public
   */
  connect(fn) {
    return this.open(fn);
  }
  /**
   * Called upon transport open.
   *
   * @private
   */
  onopen() {
    debug("open");
    // clear old subs
    this.cleanup();
    // mark as open
    this._readyState = "open";
    this.emitReserved("open");
    // add new subs
    const socket = this.engine;
    this.subs.push((0, on_js_1.on)(socket, "ping", this.onping.bind(this)), (0, on_js_1.on)(socket, "data", this.ondata.bind(this)), (0, on_js_1.on)(socket, "error", this.onerror.bind(this)), (0, on_js_1.on)(socket, "close", this.onclose.bind(this)),
    // @ts-ignore
    (0, on_js_1.on)(this.decoder, "decoded", this.ondecoded.bind(this)));
  }
  /**
   * Called upon a ping.
   *
   * @private
   */
  onping() {
    this.emitReserved("ping");
  }
  /**
   * Called with data.
   *
   * @private
   */
  ondata(data) {
    try {
      this.decoder.add(data);
    } catch (e) {
      this.onclose("parse error", e);
    }
  }
  /**
   * Called when parser fully decodes a packet.
   *
   * @private
   */
  ondecoded(packet) {
    // the nextTick call prevents an exception in a user-provided event listener from triggering a disconnection due to a "parse error"
    (0, engine_io_client_1.nextTick)(() => {
      this.emitReserved("packet", packet);
    }, this.setTimeoutFn);
  }
  /**
   * Called upon socket error.
   *
   * @private
   */
  onerror(err) {
    debug("error", err);
    this.emitReserved("error", err);
  }
  /**
   * Creates a new socket for the given `nsp`.
   *
   * @return {Socket}
   * @public
   */
  socket(nsp, opts) {
    let socket = this.nsps[nsp];
    if (!socket) {
      socket = new socket_js_1.Socket(this, nsp, opts);
      this.nsps[nsp] = socket;
    } else if (this._autoConnect && !socket.active) {
      socket.connect();
    }
    return socket;
  }
  /**
   * Called upon a socket close.
   *
   * @param socket
   * @private
   */
  _destroy(socket) {
    const nsps = Object.keys(this.nsps);
    for (const nsp of nsps) {
      const socket = this.nsps[nsp];
      if (socket.active) {
        debug("socket %s is still active, skipping close", nsp);
        return;
      }
    }
    this._close();
  }
  /**
   * Writes a packet.
   *
   * @param packet
   * @private
   */
  _packet(packet) {
    debug("writing packet %j", packet);
    const encodedPackets = this.encoder.encode(packet);
    for (let i = 0; i < encodedPackets.length; i++) {
      this.engine.write(encodedPackets[i], packet.options);
    }
  }
  /**
   * Clean up transport subscriptions and packet buffer.
   *
   * @private
   */
  cleanup() {
    debug("cleanup");
    this.subs.forEach(subDestroy => subDestroy());
    this.subs.length = 0;
    this.decoder.destroy();
  }
  /**
   * Close the current socket.
   *
   * @private
   */
  _close() {
    debug("disconnect");
    this.skipReconnect = true;
    this._reconnecting = false;
    this.onclose("forced close");
  }
  /**
   * Alias for close()
   *
   * @private
   */
  disconnect() {
    return this._close();
  }
  /**
   * Called when:
   *
   * - the low-level engine is closed
   * - the parser encountered a badly formatted packet
   * - all sockets are disconnected
   *
   * @private
   */
  onclose(reason, description) {
    var _a;
    debug("closed due to %s", reason);
    this.cleanup();
    (_a = this.engine) === null || _a === void 0 ? void 0 : _a.close();
    this.backoff.reset();
    this._readyState = "closed";
    this.emitReserved("close", reason, description);
    if (this._reconnection && !this.skipReconnect) {
      this.reconnect();
    }
  }
  /**
   * Attempt a reconnection.
   *
   * @private
   */
  reconnect() {
    if (this._reconnecting || this.skipReconnect) return this;
    const self = this;
    if (this.backoff.attempts >= this._reconnectionAttempts) {
      debug("reconnect failed");
      this.backoff.reset();
      this.emitReserved("reconnect_failed");
      this._reconnecting = false;
    } else {
      const delay = this.backoff.duration();
      debug("will wait %dms before reconnect attempt", delay);
      this._reconnecting = true;
      const timer = this.setTimeoutFn(() => {
        if (self.skipReconnect) return;
        debug("attempting reconnect");
        this.emitReserved("reconnect_attempt", self.backoff.attempts);
        // check again for the case socket closed in above events
        if (self.skipReconnect) return;
        self.open(err => {
          if (err) {
            debug("reconnect attempt error");
            self._reconnecting = false;
            self.reconnect();
            this.emitReserved("reconnect_error", err);
          } else {
            debug("reconnect success");
            self.onreconnect();
          }
        });
      }, delay);
      if (this.opts.autoUnref) {
        timer.unref();
      }
      this.subs.push(() => {
        this.clearTimeoutFn(timer);
      });
    }
  }
  /**
   * Called upon successful reconnect.
   *
   * @private
   */
  onreconnect() {
    const attempt = this.backoff.attempts;
    this._reconnecting = false;
    this.backoff.reset();
    this.emitReserved("reconnect", attempt);
  }
}
exports.Manager = Manager;

},{"./contrib/backo2.js":26,"./on.js":29,"./socket.js":30,"@socket.io/component-emitter":2,"debug":32,"engine.io-client":7,"socket.io-parser":35}],29:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.on = on;
function on(obj, ev, fn) {
  obj.on(ev, fn);
  return function subDestroy() {
    obj.off(ev, fn);
  };
}

},{}],30:[function(require,module,exports){
"use strict";

var __importDefault = void 0 && (void 0).__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Socket = void 0;
const socket_io_parser_1 = require("socket.io-parser");
const on_js_1 = require("./on.js");
const component_emitter_1 = require("@socket.io/component-emitter");
const debug_1 = __importDefault(require("debug")); // debug()
const debug = (0, debug_1.default)("socket.io-client:socket"); // debug()
/**
 * Internal events.
 * These events can't be emitted by the user.
 */
const RESERVED_EVENTS = Object.freeze({
  connect: 1,
  connect_error: 1,
  disconnect: 1,
  disconnecting: 1,
  // EventEmitter reserved events: https://nodejs.org/api/events.html#events_event_newlistener
  newListener: 1,
  removeListener: 1
});
/**
 * A Socket is the fundamental class for interacting with the server.
 *
 * A Socket belongs to a certain Namespace (by default /) and uses an underlying {@link Manager} to communicate.
 *
 * @example
 * const socket = io();
 *
 * socket.on("connect", () => {
 *   console.log("connected");
 * });
 *
 * // send an event to the server
 * socket.emit("foo", "bar");
 *
 * socket.on("foobar", () => {
 *   // an event was received from the server
 * });
 *
 * // upon disconnection
 * socket.on("disconnect", (reason) => {
 *   console.log(`disconnected due to ${reason}`);
 * });
 */
class Socket extends component_emitter_1.Emitter {
  /**
   * `Socket` constructor.
   */
  constructor(io, nsp, opts) {
    super();
    /**
     * Whether the socket is currently connected to the server.
     *
     * @example
     * const socket = io();
     *
     * socket.on("connect", () => {
     *   console.log(socket.connected); // true
     * });
     *
     * socket.on("disconnect", () => {
     *   console.log(socket.connected); // false
     * });
     */
    this.connected = false;
    /**
     * Whether the connection state was recovered after a temporary disconnection. In that case, any missed packets will
     * be transmitted by the server.
     */
    this.recovered = false;
    /**
     * Buffer for packets received before the CONNECT packet
     */
    this.receiveBuffer = [];
    /**
     * Buffer for packets that will be sent once the socket is connected
     */
    this.sendBuffer = [];
    /**
     * The queue of packets to be sent with retry in case of failure.
     *
     * Packets are sent one by one, each waiting for the server acknowledgement, in order to guarantee the delivery order.
     * @private
     */
    this._queue = [];
    /**
     * A sequence to generate the ID of the {@link QueuedPacket}.
     * @private
     */
    this._queueSeq = 0;
    this.ids = 0;
    /**
     * A map containing acknowledgement handlers.
     *
     * The `withError` attribute is used to differentiate handlers that accept an error as first argument:
     *
     * - `socket.emit("test", (err, value) => { ... })` with `ackTimeout` option
     * - `socket.timeout(5000).emit("test", (err, value) => { ... })`
     * - `const value = await socket.emitWithAck("test")`
     *
     * From those that don't:
     *
     * - `socket.emit("test", (value) => { ... });`
     *
     * In the first case, the handlers will be called with an error when:
     *
     * - the timeout is reached
     * - the socket gets disconnected
     *
     * In the second case, the handlers will be simply discarded upon disconnection, since the client will never receive
     * an acknowledgement from the server.
     *
     * @private
     */
    this.acks = {};
    this.flags = {};
    this.io = io;
    this.nsp = nsp;
    if (opts && opts.auth) {
      this.auth = opts.auth;
    }
    this._opts = Object.assign({}, opts);
    if (this.io._autoConnect) this.open();
  }
  /**
   * Whether the socket is currently disconnected
   *
   * @example
   * const socket = io();
   *
   * socket.on("connect", () => {
   *   console.log(socket.disconnected); // false
   * });
   *
   * socket.on("disconnect", () => {
   *   console.log(socket.disconnected); // true
   * });
   */
  get disconnected() {
    return !this.connected;
  }
  /**
   * Subscribe to open, close and packet events
   *
   * @private
   */
  subEvents() {
    if (this.subs) return;
    const io = this.io;
    this.subs = [(0, on_js_1.on)(io, "open", this.onopen.bind(this)), (0, on_js_1.on)(io, "packet", this.onpacket.bind(this)), (0, on_js_1.on)(io, "error", this.onerror.bind(this)), (0, on_js_1.on)(io, "close", this.onclose.bind(this))];
  }
  /**
   * Whether the Socket will try to reconnect when its Manager connects or reconnects.
   *
   * @example
   * const socket = io();
   *
   * console.log(socket.active); // true
   *
   * socket.on("disconnect", (reason) => {
   *   if (reason === "io server disconnect") {
   *     // the disconnection was initiated by the server, you need to manually reconnect
   *     console.log(socket.active); // false
   *   }
   *   // else the socket will automatically try to reconnect
   *   console.log(socket.active); // true
   * });
   */
  get active() {
    return !!this.subs;
  }
  /**
   * "Opens" the socket.
   *
   * @example
   * const socket = io({
   *   autoConnect: false
   * });
   *
   * socket.connect();
   */
  connect() {
    if (this.connected) return this;
    this.subEvents();
    if (!this.io["_reconnecting"]) this.io.open(); // ensure open
    if ("open" === this.io._readyState) this.onopen();
    return this;
  }
  /**
   * Alias for {@link connect()}.
   */
  open() {
    return this.connect();
  }
  /**
   * Sends a `message` event.
   *
   * This method mimics the WebSocket.send() method.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/send
   *
   * @example
   * socket.send("hello");
   *
   * // this is equivalent to
   * socket.emit("message", "hello");
   *
   * @return self
   */
  send(...args) {
    args.unshift("message");
    this.emit.apply(this, args);
    return this;
  }
  /**
   * Override `emit`.
   * If the event is in `events`, it's emitted normally.
   *
   * @example
   * socket.emit("hello", "world");
   *
   * // all serializable datastructures are supported (no need to call JSON.stringify)
   * socket.emit("hello", 1, "2", { 3: ["4"], 5: Uint8Array.from([6]) });
   *
   * // with an acknowledgement from the server
   * socket.emit("hello", "world", (val) => {
   *   // ...
   * });
   *
   * @return self
   */
  emit(ev, ...args) {
    var _a, _b, _c;
    if (RESERVED_EVENTS.hasOwnProperty(ev)) {
      throw new Error('"' + ev.toString() + '" is a reserved event name');
    }
    args.unshift(ev);
    if (this._opts.retries && !this.flags.fromQueue && !this.flags.volatile) {
      this._addToQueue(args);
      return this;
    }
    const packet = {
      type: socket_io_parser_1.PacketType.EVENT,
      data: args
    };
    packet.options = {};
    packet.options.compress = this.flags.compress !== false;
    // event ack callback
    if ("function" === typeof args[args.length - 1]) {
      const id = this.ids++;
      debug("emitting packet with ack id %d", id);
      const ack = args.pop();
      this._registerAckCallback(id, ack);
      packet.id = id;
    }
    const isTransportWritable = (_b = (_a = this.io.engine) === null || _a === void 0 ? void 0 : _a.transport) === null || _b === void 0 ? void 0 : _b.writable;
    const isConnected = this.connected && !((_c = this.io.engine) === null || _c === void 0 ? void 0 : _c._hasPingExpired());
    const discardPacket = this.flags.volatile && !isTransportWritable;
    if (discardPacket) {
      debug("discard packet as the transport is not currently writable");
    } else if (isConnected) {
      this.notifyOutgoingListeners(packet);
      this.packet(packet);
    } else {
      this.sendBuffer.push(packet);
    }
    this.flags = {};
    return this;
  }
  /**
   * @private
   */
  _registerAckCallback(id, ack) {
    var _a;
    const timeout = (_a = this.flags.timeout) !== null && _a !== void 0 ? _a : this._opts.ackTimeout;
    if (timeout === undefined) {
      this.acks[id] = ack;
      return;
    }
    // @ts-ignore
    const timer = this.io.setTimeoutFn(() => {
      delete this.acks[id];
      for (let i = 0; i < this.sendBuffer.length; i++) {
        if (this.sendBuffer[i].id === id) {
          debug("removing packet with ack id %d from the buffer", id);
          this.sendBuffer.splice(i, 1);
        }
      }
      debug("event with ack id %d has timed out after %d ms", id, timeout);
      ack.call(this, new Error("operation has timed out"));
    }, timeout);
    const fn = (...args) => {
      // @ts-ignore
      this.io.clearTimeoutFn(timer);
      ack.apply(this, args);
    };
    fn.withError = true;
    this.acks[id] = fn;
  }
  /**
   * Emits an event and waits for an acknowledgement
   *
   * @example
   * // without timeout
   * const response = await socket.emitWithAck("hello", "world");
   *
   * // with a specific timeout
   * try {
   *   const response = await socket.timeout(1000).emitWithAck("hello", "world");
   * } catch (err) {
   *   // the server did not acknowledge the event in the given delay
   * }
   *
   * @return a Promise that will be fulfilled when the server acknowledges the event
   */
  emitWithAck(ev, ...args) {
    return new Promise((resolve, reject) => {
      const fn = (arg1, arg2) => {
        return arg1 ? reject(arg1) : resolve(arg2);
      };
      fn.withError = true;
      args.push(fn);
      this.emit(ev, ...args);
    });
  }
  /**
   * Add the packet to the queue.
   * @param args
   * @private
   */
  _addToQueue(args) {
    let ack;
    if (typeof args[args.length - 1] === "function") {
      ack = args.pop();
    }
    const packet = {
      id: this._queueSeq++,
      tryCount: 0,
      pending: false,
      args,
      flags: Object.assign({
        fromQueue: true
      }, this.flags)
    };
    args.push((err, ...responseArgs) => {
      if (packet !== this._queue[0]) {
        // the packet has already been acknowledged
        return;
      }
      const hasError = err !== null;
      if (hasError) {
        if (packet.tryCount > this._opts.retries) {
          debug("packet [%d] is discarded after %d tries", packet.id, packet.tryCount);
          this._queue.shift();
          if (ack) {
            ack(err);
          }
        }
      } else {
        debug("packet [%d] was successfully sent", packet.id);
        this._queue.shift();
        if (ack) {
          ack(null, ...responseArgs);
        }
      }
      packet.pending = false;
      return this._drainQueue();
    });
    this._queue.push(packet);
    this._drainQueue();
  }
  /**
   * Send the first packet of the queue, and wait for an acknowledgement from the server.
   * @param force - whether to resend a packet that has not been acknowledged yet
   *
   * @private
   */
  _drainQueue(force = false) {
    debug("draining queue");
    if (!this.connected || this._queue.length === 0) {
      return;
    }
    const packet = this._queue[0];
    if (packet.pending && !force) {
      debug("packet [%d] has already been sent and is waiting for an ack", packet.id);
      return;
    }
    packet.pending = true;
    packet.tryCount++;
    debug("sending packet [%d] (try n°%d)", packet.id, packet.tryCount);
    this.flags = packet.flags;
    this.emit.apply(this, packet.args);
  }
  /**
   * Sends a packet.
   *
   * @param packet
   * @private
   */
  packet(packet) {
    packet.nsp = this.nsp;
    this.io._packet(packet);
  }
  /**
   * Called upon engine `open`.
   *
   * @private
   */
  onopen() {
    debug("transport is open - connecting");
    if (typeof this.auth == "function") {
      this.auth(data => {
        this._sendConnectPacket(data);
      });
    } else {
      this._sendConnectPacket(this.auth);
    }
  }
  /**
   * Sends a CONNECT packet to initiate the Socket.IO session.
   *
   * @param data
   * @private
   */
  _sendConnectPacket(data) {
    this.packet({
      type: socket_io_parser_1.PacketType.CONNECT,
      data: this._pid ? Object.assign({
        pid: this._pid,
        offset: this._lastOffset
      }, data) : data
    });
  }
  /**
   * Called upon engine or manager `error`.
   *
   * @param err
   * @private
   */
  onerror(err) {
    if (!this.connected) {
      this.emitReserved("connect_error", err);
    }
  }
  /**
   * Called upon engine `close`.
   *
   * @param reason
   * @param description
   * @private
   */
  onclose(reason, description) {
    debug("close (%s)", reason);
    this.connected = false;
    delete this.id;
    this.emitReserved("disconnect", reason, description);
    this._clearAcks();
  }
  /**
   * Clears the acknowledgement handlers upon disconnection, since the client will never receive an acknowledgement from
   * the server.
   *
   * @private
   */
  _clearAcks() {
    Object.keys(this.acks).forEach(id => {
      const isBuffered = this.sendBuffer.some(packet => String(packet.id) === id);
      if (!isBuffered) {
        // note: handlers that do not accept an error as first argument are ignored here
        const ack = this.acks[id];
        delete this.acks[id];
        if (ack.withError) {
          ack.call(this, new Error("socket has been disconnected"));
        }
      }
    });
  }
  /**
   * Called with socket packet.
   *
   * @param packet
   * @private
   */
  onpacket(packet) {
    const sameNamespace = packet.nsp === this.nsp;
    if (!sameNamespace) return;
    switch (packet.type) {
      case socket_io_parser_1.PacketType.CONNECT:
        if (packet.data && packet.data.sid) {
          this.onconnect(packet.data.sid, packet.data.pid);
        } else {
          this.emitReserved("connect_error", new Error("It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)"));
        }
        break;
      case socket_io_parser_1.PacketType.EVENT:
      case socket_io_parser_1.PacketType.BINARY_EVENT:
        this.onevent(packet);
        break;
      case socket_io_parser_1.PacketType.ACK:
      case socket_io_parser_1.PacketType.BINARY_ACK:
        this.onack(packet);
        break;
      case socket_io_parser_1.PacketType.DISCONNECT:
        this.ondisconnect();
        break;
      case socket_io_parser_1.PacketType.CONNECT_ERROR:
        this.destroy();
        const err = new Error(packet.data.message);
        // @ts-ignore
        err.data = packet.data.data;
        this.emitReserved("connect_error", err);
        break;
    }
  }
  /**
   * Called upon a server event.
   *
   * @param packet
   * @private
   */
  onevent(packet) {
    const args = packet.data || [];
    debug("emitting event %j", args);
    if (null != packet.id) {
      debug("attaching ack callback to event");
      args.push(this.ack(packet.id));
    }
    if (this.connected) {
      this.emitEvent(args);
    } else {
      this.receiveBuffer.push(Object.freeze(args));
    }
  }
  emitEvent(args) {
    if (this._anyListeners && this._anyListeners.length) {
      const listeners = this._anyListeners.slice();
      for (const listener of listeners) {
        listener.apply(this, args);
      }
    }
    super.emit.apply(this, args);
    if (this._pid && args.length && typeof args[args.length - 1] === "string") {
      this._lastOffset = args[args.length - 1];
    }
  }
  /**
   * Produces an ack callback to emit with an event.
   *
   * @private
   */
  ack(id) {
    const self = this;
    let sent = false;
    return function (...args) {
      // prevent double callbacks
      if (sent) return;
      sent = true;
      debug("sending ack %j", args);
      self.packet({
        type: socket_io_parser_1.PacketType.ACK,
        id: id,
        data: args
      });
    };
  }
  /**
   * Called upon a server acknowledgement.
   *
   * @param packet
   * @private
   */
  onack(packet) {
    const ack = this.acks[packet.id];
    if (typeof ack !== "function") {
      debug("bad ack %s", packet.id);
      return;
    }
    delete this.acks[packet.id];
    debug("calling ack %s with %j", packet.id, packet.data);
    // @ts-ignore FIXME ack is incorrectly inferred as 'never'
    if (ack.withError) {
      packet.data.unshift(null);
    }
    // @ts-ignore
    ack.apply(this, packet.data);
  }
  /**
   * Called upon server connect.
   *
   * @private
   */
  onconnect(id, pid) {
    debug("socket connected with id %s", id);
    this.id = id;
    this.recovered = pid && this._pid === pid;
    this._pid = pid; // defined only if connection state recovery is enabled
    this.connected = true;
    this.emitBuffered();
    this.emitReserved("connect");
    this._drainQueue(true);
  }
  /**
   * Emit buffered events (received and emitted).
   *
   * @private
   */
  emitBuffered() {
    this.receiveBuffer.forEach(args => this.emitEvent(args));
    this.receiveBuffer = [];
    this.sendBuffer.forEach(packet => {
      this.notifyOutgoingListeners(packet);
      this.packet(packet);
    });
    this.sendBuffer = [];
  }
  /**
   * Called upon server disconnect.
   *
   * @private
   */
  ondisconnect() {
    debug("server disconnect (%s)", this.nsp);
    this.destroy();
    this.onclose("io server disconnect");
  }
  /**
   * Called upon forced client/server side disconnections,
   * this method ensures the manager stops tracking us and
   * that reconnections don't get triggered for this.
   *
   * @private
   */
  destroy() {
    if (this.subs) {
      // clean subscriptions to avoid reconnections
      this.subs.forEach(subDestroy => subDestroy());
      this.subs = undefined;
    }
    this.io["_destroy"](this);
  }
  /**
   * Disconnects the socket manually. In that case, the socket will not try to reconnect.
   *
   * If this is the last active Socket instance of the {@link Manager}, the low-level connection will be closed.
   *
   * @example
   * const socket = io();
   *
   * socket.on("disconnect", (reason) => {
   *   // console.log(reason); prints "io client disconnect"
   * });
   *
   * socket.disconnect();
   *
   * @return self
   */
  disconnect() {
    if (this.connected) {
      debug("performing disconnect (%s)", this.nsp);
      this.packet({
        type: socket_io_parser_1.PacketType.DISCONNECT
      });
    }
    // remove socket from pool
    this.destroy();
    if (this.connected) {
      // fire events
      this.onclose("io client disconnect");
    }
    return this;
  }
  /**
   * Alias for {@link disconnect()}.
   *
   * @return self
   */
  close() {
    return this.disconnect();
  }
  /**
   * Sets the compress flag.
   *
   * @example
   * socket.compress(false).emit("hello");
   *
   * @param compress - if `true`, compresses the sending data
   * @return self
   */
  compress(compress) {
    this.flags.compress = compress;
    return this;
  }
  /**
   * Sets a modifier for a subsequent event emission that the event message will be dropped when this socket is not
   * ready to send messages.
   *
   * @example
   * socket.volatile.emit("hello"); // the server may or may not receive it
   *
   * @returns self
   */
  get volatile() {
    this.flags.volatile = true;
    return this;
  }
  /**
   * Sets a modifier for a subsequent event emission that the callback will be called with an error when the
   * given number of milliseconds have elapsed without an acknowledgement from the server:
   *
   * @example
   * socket.timeout(5000).emit("my-event", (err) => {
   *   if (err) {
   *     // the server did not acknowledge the event in the given delay
   *   }
   * });
   *
   * @returns self
   */
  timeout(timeout) {
    this.flags.timeout = timeout;
    return this;
  }
  /**
   * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
   * callback.
   *
   * @example
   * socket.onAny((event, ...args) => {
   *   console.log(`got ${event}`);
   * });
   *
   * @param listener
   */
  onAny(listener) {
    this._anyListeners = this._anyListeners || [];
    this._anyListeners.push(listener);
    return this;
  }
  /**
   * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
   * callback. The listener is added to the beginning of the listeners array.
   *
   * @example
   * socket.prependAny((event, ...args) => {
   *   console.log(`got event ${event}`);
   * });
   *
   * @param listener
   */
  prependAny(listener) {
    this._anyListeners = this._anyListeners || [];
    this._anyListeners.unshift(listener);
    return this;
  }
  /**
   * Removes the listener that will be fired when any event is emitted.
   *
   * @example
   * const catchAllListener = (event, ...args) => {
   *   console.log(`got event ${event}`);
   * }
   *
   * socket.onAny(catchAllListener);
   *
   * // remove a specific listener
   * socket.offAny(catchAllListener);
   *
   * // or remove all listeners
   * socket.offAny();
   *
   * @param listener
   */
  offAny(listener) {
    if (!this._anyListeners) {
      return this;
    }
    if (listener) {
      const listeners = this._anyListeners;
      for (let i = 0; i < listeners.length; i++) {
        if (listener === listeners[i]) {
          listeners.splice(i, 1);
          return this;
        }
      }
    } else {
      this._anyListeners = [];
    }
    return this;
  }
  /**
   * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
   * e.g. to remove listeners.
   */
  listenersAny() {
    return this._anyListeners || [];
  }
  /**
   * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
   * callback.
   *
   * Note: acknowledgements sent to the server are not included.
   *
   * @example
   * socket.onAnyOutgoing((event, ...args) => {
   *   console.log(`sent event ${event}`);
   * });
   *
   * @param listener
   */
  onAnyOutgoing(listener) {
    this._anyOutgoingListeners = this._anyOutgoingListeners || [];
    this._anyOutgoingListeners.push(listener);
    return this;
  }
  /**
   * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
   * callback. The listener is added to the beginning of the listeners array.
   *
   * Note: acknowledgements sent to the server are not included.
   *
   * @example
   * socket.prependAnyOutgoing((event, ...args) => {
   *   console.log(`sent event ${event}`);
   * });
   *
   * @param listener
   */
  prependAnyOutgoing(listener) {
    this._anyOutgoingListeners = this._anyOutgoingListeners || [];
    this._anyOutgoingListeners.unshift(listener);
    return this;
  }
  /**
   * Removes the listener that will be fired when any event is emitted.
   *
   * @example
   * const catchAllListener = (event, ...args) => {
   *   console.log(`sent event ${event}`);
   * }
   *
   * socket.onAnyOutgoing(catchAllListener);
   *
   * // remove a specific listener
   * socket.offAnyOutgoing(catchAllListener);
   *
   * // or remove all listeners
   * socket.offAnyOutgoing();
   *
   * @param [listener] - the catch-all listener (optional)
   */
  offAnyOutgoing(listener) {
    if (!this._anyOutgoingListeners) {
      return this;
    }
    if (listener) {
      const listeners = this._anyOutgoingListeners;
      for (let i = 0; i < listeners.length; i++) {
        if (listener === listeners[i]) {
          listeners.splice(i, 1);
          return this;
        }
      }
    } else {
      this._anyOutgoingListeners = [];
    }
    return this;
  }
  /**
   * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
   * e.g. to remove listeners.
   */
  listenersAnyOutgoing() {
    return this._anyOutgoingListeners || [];
  }
  /**
   * Notify the listeners for each packet sent
   *
   * @param packet
   *
   * @private
   */
  notifyOutgoingListeners(packet) {
    if (this._anyOutgoingListeners && this._anyOutgoingListeners.length) {
      const listeners = this._anyOutgoingListeners.slice();
      for (const listener of listeners) {
        listener.apply(this, packet.data);
      }
    }
  }
}
exports.Socket = Socket;

},{"./on.js":29,"@socket.io/component-emitter":2,"debug":32,"socket.io-parser":35}],31:[function(require,module,exports){
"use strict";

var __importDefault = void 0 && (void 0).__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.url = url;
const engine_io_client_1 = require("engine.io-client");
const debug_1 = __importDefault(require("debug")); // debug()
const debug = (0, debug_1.default)("socket.io-client:url"); // debug()
/**
 * URL parser.
 *
 * @param uri - url
 * @param path - the request path of the connection
 * @param loc - An object meant to mimic window.location.
 *        Defaults to window.location.
 * @public
 */
function url(uri, path = "", loc) {
  let obj = uri;
  // default to window.location
  loc = loc || typeof location !== "undefined" && location;
  if (null == uri) uri = loc.protocol + "//" + loc.host;
  // relative path support
  if (typeof uri === "string") {
    if ("/" === uri.charAt(0)) {
      if ("/" === uri.charAt(1)) {
        uri = loc.protocol + uri;
      } else {
        uri = loc.host + uri;
      }
    }
    if (!/^(https?|wss?):\/\//.test(uri)) {
      debug("protocol-less url %s", uri);
      if ("undefined" !== typeof loc) {
        uri = loc.protocol + "//" + uri;
      } else {
        uri = "https://" + uri;
      }
    }
    // parse
    debug("parse %s", uri);
    obj = (0, engine_io_client_1.parse)(uri);
  }
  // make sure we treat `localhost:80` and `localhost` equally
  if (!obj.port) {
    if (/^(http|ws)$/.test(obj.protocol)) {
      obj.port = "80";
    } else if (/^(http|ws)s$/.test(obj.protocol)) {
      obj.port = "443";
    }
  }
  obj.path = obj.path || "/";
  const ipv6 = obj.host.indexOf(":") !== -1;
  const host = ipv6 ? "[" + obj.host + "]" : obj.host;
  // define unique id
  obj.id = obj.protocol + "://" + host + ":" + obj.port + path;
  // define href
  obj.href = obj.protocol + "://" + host + (loc && loc.port === obj.port ? "" : ":" + obj.port);
  return obj;
}

},{"debug":32,"engine.io-client":7}],32:[function(require,module,exports){
arguments[4][17][0].apply(exports,arguments)
},{"./common":33,"_process":25,"dup":17}],33:[function(require,module,exports){
arguments[4][18][0].apply(exports,arguments)
},{"dup":18,"ms":24}],34:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.reconstructPacket = exports.deconstructPacket = void 0;
const is_binary_js_1 = require("./is-binary.js");
/**
 * Replaces every Buffer | ArrayBuffer | Blob | File in packet with a numbered placeholder.
 *
 * @param {Object} packet - socket.io event packet
 * @return {Object} with deconstructed packet and list of buffers
 * @public
 */
function deconstructPacket(packet) {
  const buffers = [];
  const packetData = packet.data;
  const pack = packet;
  pack.data = _deconstructPacket(packetData, buffers);
  pack.attachments = buffers.length; // number of binary 'attachments'
  return {
    packet: pack,
    buffers: buffers
  };
}
exports.deconstructPacket = deconstructPacket;
function _deconstructPacket(data, buffers) {
  if (!data) return data;
  if ((0, is_binary_js_1.isBinary)(data)) {
    const placeholder = {
      _placeholder: true,
      num: buffers.length
    };
    buffers.push(data);
    return placeholder;
  } else if (Array.isArray(data)) {
    const newData = new Array(data.length);
    for (let i = 0; i < data.length; i++) {
      newData[i] = _deconstructPacket(data[i], buffers);
    }
    return newData;
  } else if (typeof data === "object" && !(data instanceof Date)) {
    const newData = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        newData[key] = _deconstructPacket(data[key], buffers);
      }
    }
    return newData;
  }
  return data;
}
/**
 * Reconstructs a binary packet from its placeholder packet and buffers
 *
 * @param {Object} packet - event packet with placeholders
 * @param {Array} buffers - binary buffers to put in placeholder positions
 * @return {Object} reconstructed packet
 * @public
 */
function reconstructPacket(packet, buffers) {
  packet.data = _reconstructPacket(packet.data, buffers);
  delete packet.attachments; // no longer useful
  return packet;
}
exports.reconstructPacket = reconstructPacket;
function _reconstructPacket(data, buffers) {
  if (!data) return data;
  if (data && data._placeholder === true) {
    const isIndexValid = typeof data.num === "number" && data.num >= 0 && data.num < buffers.length;
    if (isIndexValid) {
      return buffers[data.num]; // appropriate buffer (should be natural order anyway)
    } else {
      throw new Error("illegal attachments");
    }
  } else if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      data[i] = _reconstructPacket(data[i], buffers);
    }
  } else if (typeof data === "object") {
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        data[key] = _reconstructPacket(data[key], buffers);
      }
    }
  }
  return data;
}

},{"./is-binary.js":36}],35:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Decoder = exports.Encoder = exports.PacketType = exports.protocol = void 0;
const component_emitter_1 = require("@socket.io/component-emitter");
const binary_js_1 = require("./binary.js");
const is_binary_js_1 = require("./is-binary.js");
const debug_1 = require("debug"); // debug()
const debug = (0, debug_1.default)("socket.io-parser"); // debug()
/**
 * These strings must not be used as event names, as they have a special meaning.
 */
const RESERVED_EVENTS = ["connect", "connect_error", "disconnect", "disconnecting", "newListener", "removeListener" // used by the Node.js EventEmitter
];
/**
 * Protocol version.
 *
 * @public
 */
exports.protocol = 5;
var PacketType;
(function (PacketType) {
  PacketType[PacketType["CONNECT"] = 0] = "CONNECT";
  PacketType[PacketType["DISCONNECT"] = 1] = "DISCONNECT";
  PacketType[PacketType["EVENT"] = 2] = "EVENT";
  PacketType[PacketType["ACK"] = 3] = "ACK";
  PacketType[PacketType["CONNECT_ERROR"] = 4] = "CONNECT_ERROR";
  PacketType[PacketType["BINARY_EVENT"] = 5] = "BINARY_EVENT";
  PacketType[PacketType["BINARY_ACK"] = 6] = "BINARY_ACK";
})(PacketType = exports.PacketType || (exports.PacketType = {}));
/**
 * A socket.io Encoder instance
 */
class Encoder {
  /**
   * Encoder constructor
   *
   * @param {function} replacer - custom replacer to pass down to JSON.parse
   */
  constructor(replacer) {
    this.replacer = replacer;
  }
  /**
   * Encode a packet as a single string if non-binary, or as a
   * buffer sequence, depending on packet type.
   *
   * @param {Object} obj - packet object
   */
  encode(obj) {
    debug("encoding packet %j", obj);
    if (obj.type === PacketType.EVENT || obj.type === PacketType.ACK) {
      if ((0, is_binary_js_1.hasBinary)(obj)) {
        return this.encodeAsBinary({
          type: obj.type === PacketType.EVENT ? PacketType.BINARY_EVENT : PacketType.BINARY_ACK,
          nsp: obj.nsp,
          data: obj.data,
          id: obj.id
        });
      }
    }
    return [this.encodeAsString(obj)];
  }
  /**
   * Encode packet as string.
   */
  encodeAsString(obj) {
    // first is type
    let str = "" + obj.type;
    // attachments if we have them
    if (obj.type === PacketType.BINARY_EVENT || obj.type === PacketType.BINARY_ACK) {
      str += obj.attachments + "-";
    }
    // if we have a namespace other than `/`
    // we append it followed by a comma `,`
    if (obj.nsp && "/" !== obj.nsp) {
      str += obj.nsp + ",";
    }
    // immediately followed by the id
    if (null != obj.id) {
      str += obj.id;
    }
    // json data
    if (null != obj.data) {
      str += JSON.stringify(obj.data, this.replacer);
    }
    debug("encoded %j as %s", obj, str);
    return str;
  }
  /**
   * Encode packet as 'buffer sequence' by removing blobs, and
   * deconstructing packet into object with placeholders and
   * a list of buffers.
   */
  encodeAsBinary(obj) {
    const deconstruction = (0, binary_js_1.deconstructPacket)(obj);
    const pack = this.encodeAsString(deconstruction.packet);
    const buffers = deconstruction.buffers;
    buffers.unshift(pack); // add packet info to beginning of data list
    return buffers; // write all the buffers
  }
}
exports.Encoder = Encoder;
// see https://stackoverflow.com/questions/8511281/check-if-a-value-is-an-object-in-javascript
function isObject(value) {
  return Object.prototype.toString.call(value) === "[object Object]";
}
/**
 * A socket.io Decoder instance
 *
 * @return {Object} decoder
 */
class Decoder extends component_emitter_1.Emitter {
  /**
   * Decoder constructor
   *
   * @param {function} reviver - custom reviver to pass down to JSON.stringify
   */
  constructor(reviver) {
    super();
    this.reviver = reviver;
  }
  /**
   * Decodes an encoded packet string into packet JSON.
   *
   * @param {String} obj - encoded packet
   */
  add(obj) {
    let packet;
    if (typeof obj === "string") {
      if (this.reconstructor) {
        throw new Error("got plaintext data when reconstructing a packet");
      }
      packet = this.decodeString(obj);
      const isBinaryEvent = packet.type === PacketType.BINARY_EVENT;
      if (isBinaryEvent || packet.type === PacketType.BINARY_ACK) {
        packet.type = isBinaryEvent ? PacketType.EVENT : PacketType.ACK;
        // binary packet's json
        this.reconstructor = new BinaryReconstructor(packet);
        // no attachments, labeled binary but no binary data to follow
        if (packet.attachments === 0) {
          super.emitReserved("decoded", packet);
        }
      } else {
        // non-binary full packet
        super.emitReserved("decoded", packet);
      }
    } else if ((0, is_binary_js_1.isBinary)(obj) || obj.base64) {
      // raw binary data
      if (!this.reconstructor) {
        throw new Error("got binary data when not reconstructing a packet");
      } else {
        packet = this.reconstructor.takeBinaryData(obj);
        if (packet) {
          // received final buffer
          this.reconstructor = null;
          super.emitReserved("decoded", packet);
        }
      }
    } else {
      throw new Error("Unknown type: " + obj);
    }
  }
  /**
   * Decode a packet String (JSON data)
   *
   * @param {String} str
   * @return {Object} packet
   */
  decodeString(str) {
    let i = 0;
    // look up type
    const p = {
      type: Number(str.charAt(0))
    };
    if (PacketType[p.type] === undefined) {
      throw new Error("unknown packet type " + p.type);
    }
    // look up attachments if type binary
    if (p.type === PacketType.BINARY_EVENT || p.type === PacketType.BINARY_ACK) {
      const start = i + 1;
      while (str.charAt(++i) !== "-" && i != str.length) {}
      const buf = str.substring(start, i);
      if (buf != Number(buf) || str.charAt(i) !== "-") {
        throw new Error("Illegal attachments");
      }
      p.attachments = Number(buf);
    }
    // look up namespace (if any)
    if ("/" === str.charAt(i + 1)) {
      const start = i + 1;
      while (++i) {
        const c = str.charAt(i);
        if ("," === c) break;
        if (i === str.length) break;
      }
      p.nsp = str.substring(start, i);
    } else {
      p.nsp = "/";
    }
    // look up id
    const next = str.charAt(i + 1);
    if ("" !== next && Number(next) == next) {
      const start = i + 1;
      while (++i) {
        const c = str.charAt(i);
        if (null == c || Number(c) != c) {
          --i;
          break;
        }
        if (i === str.length) break;
      }
      p.id = Number(str.substring(start, i + 1));
    }
    // look up json data
    if (str.charAt(++i)) {
      const payload = this.tryParse(str.substr(i));
      if (Decoder.isPayloadValid(p.type, payload)) {
        p.data = payload;
      } else {
        throw new Error("invalid payload");
      }
    }
    debug("decoded %s as %j", str, p);
    return p;
  }
  tryParse(str) {
    try {
      return JSON.parse(str, this.reviver);
    } catch (e) {
      return false;
    }
  }
  static isPayloadValid(type, payload) {
    switch (type) {
      case PacketType.CONNECT:
        return isObject(payload);
      case PacketType.DISCONNECT:
        return payload === undefined;
      case PacketType.CONNECT_ERROR:
        return typeof payload === "string" || isObject(payload);
      case PacketType.EVENT:
      case PacketType.BINARY_EVENT:
        return Array.isArray(payload) && (typeof payload[0] === "number" || typeof payload[0] === "string" && RESERVED_EVENTS.indexOf(payload[0]) === -1);
      case PacketType.ACK:
      case PacketType.BINARY_ACK:
        return Array.isArray(payload);
    }
  }
  /**
   * Deallocates a parser's resources
   */
  destroy() {
    if (this.reconstructor) {
      this.reconstructor.finishedReconstruction();
      this.reconstructor = null;
    }
  }
}
exports.Decoder = Decoder;
/**
 * A manager of a binary event's 'buffer sequence'. Should
 * be constructed whenever a packet of type BINARY_EVENT is
 * decoded.
 *
 * @param {Object} packet
 * @return {BinaryReconstructor} initialized reconstructor
 */
class BinaryReconstructor {
  constructor(packet) {
    this.packet = packet;
    this.buffers = [];
    this.reconPack = packet;
  }
  /**
   * Method to be called when binary data received from connection
   * after a BINARY_EVENT packet.
   *
   * @param {Buffer | ArrayBuffer} binData - the raw binary data received
   * @return {null | Object} returns null if more binary data is expected or
   *   a reconstructed packet object if all buffers have been received.
   */
  takeBinaryData(binData) {
    this.buffers.push(binData);
    if (this.buffers.length === this.reconPack.attachments) {
      // done with buffer list
      const packet = (0, binary_js_1.reconstructPacket)(this.reconPack, this.buffers);
      this.finishedReconstruction();
      return packet;
    }
    return null;
  }
  /**
   * Cleans up binary packet reconstruction variables.
   */
  finishedReconstruction() {
    this.reconPack = null;
    this.buffers = [];
  }
}

},{"./binary.js":34,"./is-binary.js":36,"@socket.io/component-emitter":2,"debug":37}],36:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.hasBinary = exports.isBinary = void 0;
const withNativeArrayBuffer = typeof ArrayBuffer === "function";
const isView = obj => {
  return typeof ArrayBuffer.isView === "function" ? ArrayBuffer.isView(obj) : obj.buffer instanceof ArrayBuffer;
};
const toString = Object.prototype.toString;
const withNativeBlob = typeof Blob === "function" || typeof Blob !== "undefined" && toString.call(Blob) === "[object BlobConstructor]";
const withNativeFile = typeof File === "function" || typeof File !== "undefined" && toString.call(File) === "[object FileConstructor]";
/**
 * Returns true if obj is a Buffer, an ArrayBuffer, a Blob or a File.
 *
 * @private
 */
function isBinary(obj) {
  return withNativeArrayBuffer && (obj instanceof ArrayBuffer || isView(obj)) || withNativeBlob && obj instanceof Blob || withNativeFile && obj instanceof File;
}
exports.isBinary = isBinary;
function hasBinary(obj, toJSON) {
  if (!obj || typeof obj !== "object") {
    return false;
  }
  if (Array.isArray(obj)) {
    for (let i = 0, l = obj.length; i < l; i++) {
      if (hasBinary(obj[i])) {
        return true;
      }
    }
    return false;
  }
  if (isBinary(obj)) {
    return true;
  }
  if (obj.toJSON && typeof obj.toJSON === "function" && arguments.length === 1) {
    return hasBinary(obj.toJSON(), true);
  }
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && hasBinary(obj[key])) {
      return true;
    }
  }
  return false;
}
exports.hasBinary = hasBinary;

},{}],37:[function(require,module,exports){
arguments[4][17][0].apply(exports,arguments)
},{"./common":38,"_process":25,"dup":17}],38:[function(require,module,exports){
arguments[4][18][0].apply(exports,arguments)
},{"dup":18,"ms":24}],39:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _logger = require("./modules/logger.js");
var _fileLogger = require("./modules/file-logger.js");
var _settingsManager = require("./modules/settings-manager.js");
var _uiManager = require("./modules/ui-manager.js");
var _localApiClient = require("./modules/local-api-client.js");
var _pingoneClient = require("./modules/pingone-client.js");
var _tokenManager = _interopRequireDefault(require("./modules/token-manager.js"));
var _fileHandler = require("./modules/file-handler.js");
var _versionManager = require("./modules/version-manager.js");
var _apiFactory = require("./modules/api-factory.js");
var _progressManager = _interopRequireDefault(require("./modules/progress-manager.js"));
var _deleteManager = require("./modules/delete-manager.js");
var _exportManager = require("./modules/export-manager.js");
var _historyManager = require("./modules/history-manager.js");
var _tokenAlertModal = require("./modules/token-alert-modal.js");
var _socket = require("socket.io-client");
// File: app.js
// Description: Main application entry point for PingOne user import tool
// 
// This file orchestrates the entire application, managing:
// - UI state and view transitions
// - File upload and CSV processing
// - Import/export/modify/delete operations
// - Real-time progress tracking via SSE
// - Settings management and population selection
// - Error handling and user feedback
// - Disclaimer agreement and feature flags

/**
 * Secret Field Toggle Component
 * 
 * Manages the visibility toggle for sensitive input fields (like API secrets).
 * Provides a secure way to show/hide sensitive data with visual feedback.
 * 
 * Features:
 * - Toggle between visible and masked input
 * - Visual eye icon that changes based on state
 * - Maintains actual value while showing masked version
 * - Prevents accidental exposure of sensitive data
 */
class SecretFieldToggle {
  constructor() {
    // Core DOM elements for the toggle functionality
    this.inputElement = null;
    this.eyeButton = null;

    // State tracking for visibility and initialization
    this.isVisible = false;
    this.actualValue = '';
    this.isInitialized = false;
  }

  /**
   * Initialize the secret field toggle component
   * 
   * Sets up DOM element references and event handlers for the toggle functionality.
   * Called during app initialization to prepare the secret field for user interaction.
   * 
   * @returns {void}
   */
  init() {
    // Prevent double initialization
    if (this.isInitialized) {
      return;
    }

    // Get references to the required DOM elements
    this.inputElement = document.getElementById('api-secret');
    this.eyeButton = document.getElementById('toggle-api-secret-visibility');

    // Validate that both elements exist before proceeding
    if (!this.inputElement || !this.eyeButton) {
      console.error('❌ Secret field elements not found');
      console.error('Input element:', !!this.inputElement);
      console.error('Eye button:', !!this.eyeButton);
      return;
    }
    console.log('✅ Secret field elements found');
    console.log('Input element ID:', this.inputElement.id);
    console.log('Eye button ID:', this.eyeButton.id);

    // Set up event handlers for user interaction
    this.setupToggleHandler();
    this.handleInputChange();

    // Mark as initialized to prevent re-initialization
    this.isInitialized = true;
    console.log('✅ Secret field toggle initialized');
  }

  /**
   * Set up the toggle button click handler
   * 
   * Binds the click event to the eye button for toggling visibility.
   * Ensures proper event handling and prevents memory leaks.
   * 
   * @returns {void}
   */
  setupToggleHandler() {
    // Remove any existing listeners to prevent duplicates
    this.eyeButton.removeEventListener('click', this.handleToggleClick);

    // Add the click handler with proper binding
    this.eyeButton.addEventListener('click', this.handleToggleClick.bind(this));
    console.log('Secret field toggle handler set up');
  }

  /**
   * Handle the toggle button click event
   * 
   * Toggles the visibility state of the secret field and updates the UI accordingly.
   * Prevents event bubbling and provides visual feedback to the user.
   * 
   * @param {Event} e - The click event object
   * @returns {void}
   */
  handleToggleClick(e) {
    // Prevent default behavior and stop event propagation
    e.preventDefault();
    e.stopPropagation();
    console.log('🔍 Eye button clicked!');
    console.log('Current visibility:', this.isVisible);
    console.log('Current value length:', this.actualValue.length);

    // Toggle the visibility state
    this.isVisible = !this.isVisible;

    // Update the input field display based on new state
    this.updateInputField();

    // Update the eye icon to reflect current state
    this.updateEyeIcon();
    console.log('✅ Toggle completed!');
    console.log('New visibility:', this.isVisible);
    console.log('Input type:', this.inputElement.type);
    console.log('Input value length:', this.inputElement.value.length);
  }

  /**
   * Update the input field display based on visibility state
   * 
   * Switches between text and password input types to show/hide the actual value.
   * Maintains the actual value while providing visual masking for security.
   * 
   * @returns {void}
   */
  updateInputField() {
    if (!this.inputElement) {
      return;
    }
    if (this.isVisible) {
      // Show the actual value in plain text
      this.inputElement.type = 'text';
      this.inputElement.value = this.actualValue;
    } else {
      // Show masked value using password input type
      this.inputElement.type = 'password';
      this.inputElement.value = this.actualValue || '';
    }
  }

  /**
   * Update the eye icon to reflect current visibility state
   * 
   * Changes the FontAwesome icon class to show either an open eye (visible)
   * or crossed-out eye (hidden) based on the current state.
   * 
   * @returns {void}
   */
  updateEyeIcon() {
    if (!this.eyeButton) {
      return;
    }

    // Find the icon element within the button
    const iconElement = this.eyeButton.querySelector('i');
    if (!iconElement) {
      return;
    }
    if (this.isVisible) {
      // Show open eye icon for visible state
      iconElement.classList.remove('fa-eye-slash');
      iconElement.classList.add('fa-eye');
    } else {
      // Show crossed-out eye icon for hidden state
      iconElement.classList.remove('fa-eye');
      iconElement.classList.add('fa-eye-slash');
    }
  }

  /**
   * Set the secret value and update display
   * 
   * Called when the form is populated with existing settings.
   * Always starts in hidden state for security.
   * 
   * @param {string} value - The secret value to store
   * @returns {void}
   */
  setValue(value) {
    this.actualValue = value || '';

    // Always start in hidden state for security
    this.isVisible = false;

    // Update the display to reflect the new value
    this.updateInputField();
    this.updateEyeIcon();
    console.log('Secret field value set, length:', this.actualValue.length);
  }

  /**
   * Get the current secret value
   * 
   * Returns the actual stored value, not the displayed value.
   * 
   * @returns {string} The current secret value
   */
  getValue() {
    return this.actualValue;
  }

  /**
   * Handle input changes when user types in the field
   * 
   * Updates the stored value to match what the user is typing.
   * Ensures the actual value stays synchronized with user input.
   * 
   * @returns {void}
   */
  handleInputChange() {
    if (!this.inputElement) {
      return;
    }

    // Listen for input changes and update stored value
    this.inputElement.addEventListener('input', e => {
      this.actualValue = e.target.value;
      console.log('Secret field input changed, new length:', this.actualValue.length);
    });
  }
}

/**
 * Main Application Class
 * 
 * Orchestrates the entire PingOne user import tool application.
 * Manages all UI interactions, API calls, file processing, and state management.
 * 
 * Key Responsibilities:
 * - Initialize and coordinate all component modules
 * - Handle user interactions and view transitions
 * - Manage import/export/modify/delete operations
 * - Provide real-time progress feedback via SSE
 * - Handle error states and user notifications
 * - Manage settings and population selection
 */
class App {
  constructor() {
    // Production environment detection
    this.isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && !window.location.hostname.includes('dev');

    // Initialize core dependencies with safety checks
    try {
      this.logger = new _logger.Logger();
      this.fileLogger = new _fileLogger.FileLogger();
      this.settingsManager = new _settingsManager.SettingsManager();
      this.uiManager = new _uiManager.UIManager();
      this.localClient = new _localApiClient.LocalAPIClient();
      this.versionManager = new _versionManager.VersionManager();

      // Create a safe logger wrapper to prevent undefined method errors
      this.safeLogger = {
        info: (msg, data) => {
          try {
            if (this.logger && typeof this.logger.info === 'function') {
              this.logger.info(msg, data);
            } else {
              console.log(`[INFO] ${msg}`, data);
            }
          } catch (error) {
            console.log(`[INFO] ${msg}`, data);
          }
        },
        warn: (msg, data) => {
          try {
            if (this.logger && typeof this.logger.warn === 'function') {
              this.logger.warn(msg, data);
            } else {
              console.warn(`[WARN] ${msg}`, data);
            }
          } catch (error) {
            console.warn(`[WARN] ${msg}`, data);
          }
        },
        error: (msg, data) => {
          try {
            if (this.logger && typeof this.logger.error === 'function') {
              this.logger.error(msg, data);
            } else {
              console.error(`[ERROR] ${msg}`, data);
            }
          } catch (error) {
            console.error(`[ERROR] ${msg}`, data);
          }
        }
      };

      // Initialize state variables with safe defaults
      this.currentView = 'home';
      this.selectedPopulationId = null;
      this.selectedPopulationName = null;
      this.populationChoice = null;
      this.importErrors = [];
      this.importSessionId = null;

      // Initialize components that might fail
      this.secretFieldToggle = null;
      this.fileHandler = null;
      this.pingOneClient = null;
      this.deleteManager = null;
      this.exportManager = null;
      console.log('✅ App constructor completed successfully');

      // Production-specific configurations
      if (this.isProduction) {
        // Disable debug mode in production
        window.DEBUG_MODE = false;

        // Add production error reporting
        window.addEventListener('error', event => {
          this.safeLogger.error('Unhandled error in production', {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            error: event.error?.stack
          });
        });

        // Add unhandled promise rejection handler
        window.addEventListener('unhandledrejection', event => {
          this.safeLogger.error('Unhandled promise rejection in production', {
            reason: event.reason,
            promise: event.promise
          });
        });
      }
    } catch (error) {
      console.error('❌ Error in App constructor:', error);
      // Ensure basic functionality even if some components fail
      this.logger = {
        error: console.error,
        warn: console.warn,
        info: console.log
      };
    }
  }

  /**
   * Initialize the application and all its components
   * 
   * Sets up all modules, loads settings, establishes connections,
   * and prepares the UI for user interaction. This is the main
   * entry point after the app is constructed.
   * 
   * @returns {Promise<void>}
   */
  async init() {
    try {
      console.log('Initializing app...');

      // Ensure logManager is available with fallback
      if (!window.logManager) {
        window.logManager = {};
      }
      if (typeof window.logManager.log !== 'function') {
        window.logManager.log = function (level, message, data) {
          const timestamp = new Date().toISOString();
          const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
          if (data) {
            console.log(logMessage, data);
          } else {
            console.log(logMessage);
          }
        };
      }

      // Ensure DOM is ready before proceeding with UI-dependent operations
      if (document.readyState === 'loading') {
        console.log('DOM still loading, waiting for DOMContentLoaded...');
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('DOM ready timeout - page may be unresponsive'));
          }, 30000); // 30 second timeout

          document.addEventListener('DOMContentLoaded', () => {
            clearTimeout(timeout);
            resolve();
          }, {
            once: true
          });
        });
      }

      // Additional validation to ensure critical elements exist
      const criticalElements = ['notification-area', 'universal-token-status', 'connection-status'];
      const missingElements = criticalElements.filter(id => !document.getElementById(id));
      if (missingElements.length > 0) {
        throw new Error(`Critical UI elements missing: ${missingElements.join(', ')}`);
      }

      // Validate core dependencies before proceeding
      if (!this.logger) {
        throw new Error('Logger not initialized');
      }
      if (!this.settingsManager) {
        throw new Error('SettingsManager not initialized');
      }
      if (!this.uiManager) {
        throw new Error('UIManager not initialized');
      }

      // Initialize API Factory first to establish API client infrastructure
      await this.initAPIFactory();

      // Initialize API clients for PingOne communication with safety check
      if (_apiFactory.apiFactory) {
        this.pingOneClient = _apiFactory.apiFactory.getPingOneClient(this.logger, this.settingsManager);
      } else {
        this.logger.warn('API Factory not available, PingOne client not initialized');
      }

      // Initialize UI manager for interface management
      if (this.uiManager && typeof this.uiManager.init === 'function') {
        await this.uiManager.init();
      } else {
        this.logger.warn('UIManager not properly initialized');
      }

      // Initialize settings manager for configuration handling
      if (this.settingsManager && typeof this.settingsManager.init === 'function') {
        await this.settingsManager.init();
      } else {
        this.logger.warn('SettingsManager not properly initialized');
      }

      // Initialize FileHandler with safety check
      try {
        this.fileHandler = new _fileHandler.FileHandler(this.logger, this.uiManager);
        // Initialize global drag-and-drop prevention and routing
        if (this.fileHandler && typeof this.fileHandler.initializeGlobalDragAndDrop === 'function') {
          this.fileHandler.initializeGlobalDragAndDrop();
        }
      } catch (error) {
        this.logger.error('Failed to initialize FileHandler:', error);
        this.fileHandler = null;
      }

      // Initialize secret field toggle for secure input handling with safety check
      try {
        this.secretFieldToggle = new SecretFieldToggle();
        if (this.secretFieldToggle && typeof this.secretFieldToggle.init === 'function') {
          this.secretFieldToggle.init();
        }
      } catch (error) {
        this.logger.error('Failed to initialize SecretFieldToggle:', error);
        this.secretFieldToggle = null;
      }

      // Initialize delete manager for enhanced delete functionality
      try {
        this.deleteManager = new _deleteManager.DeleteManager();
        console.log('✅ DeleteManager initialized successfully');
      } catch (error) {
        console.warn('DeleteManager initialization warning:', error);
        this.deleteManager = null;
      }

      // Initialize export manager for enhanced export functionality
      try {
        this.exportManager = new _exportManager.ExportManager();
        this.historyManager = new _historyManager.HistoryManager();
        console.log('✅ ExportManager initialized successfully');
      } catch (error) {
        console.warn('ExportManager initialization warning:', error);
        this.exportManager = null;
      }

      // Initialize progress manager for enhanced progress tracking
      try {
        if (_progressManager.default && typeof _progressManager.default.initialize === 'function') {
          _progressManager.default.initialize();
          console.log('✅ ProgressManager initialized successfully');
        } else {
          console.warn('ProgressManager not available or missing initialize method');
        }
      } catch (error) {
        console.warn('ProgressManager initialization warning:', error);
      }

      // Load application settings from storage with safety check
      try {
        await this.loadSettings();
      } catch (error) {
        this.logger.error('Failed to load settings:', error);
      }

      // Initialize universal token status after UI manager is ready
      try {
        this.updateUniversalTokenStatus();
      } catch (error) {
        this.logger.error('Failed to update universal token status:', error);
      }

      // Set up event listeners with safety check
      try {
        this.setupEventListeners();
      } catch (error) {
        this.logger.error('Failed to setup event listeners:', error);
      }

      // Check disclaimer status and setup if needed
      // Ensures user has accepted terms before using the tool
      try {
        const disclaimerPreviouslyAccepted = this.checkDisclaimerStatus();
        if (!disclaimerPreviouslyAccepted) {
          console.log('Disclaimer not previously accepted, setting up disclaimer agreement');
          this.setupDisclaimerAgreement();
        } else {
          console.log('Disclaimer previously accepted, tool already enabled');
        }
      } catch (error) {
        console.warn('Failed to setup disclaimer:', error);
      }

      // Check server connection status to ensure backend is available
      try {
        await this.checkServerConnectionStatus();
      } catch (error) {
        this.logger.error('Failed to check server connection status:', error);
      }

      // Update import button state after initialization
      // Ensures UI reflects current application state
      try {
        this.updateImportButtonState();
      } catch (error) {
        this.logger.error('Failed to update import button state:', error);
      }

      // Update version information in UI for user reference
      try {
        if (this.versionManager && typeof this.versionManager.updateTitle === 'function') {
          this.versionManager.updateTitle();
        }
      } catch (error) {
        this.logger.error('Failed to update version information:', error);
      }

      // Navigation visibility is handled by the UI manager

      console.log('App initialization complete');
      console.log("✅ Moved Import Progress section below Import Users button");
    } catch (error) {
      console.error('Error initializing app:', error);
      this.logger.error('App initialization failed', error);

      // Show user-friendly error message
      try {
        if (this.uiManager && typeof this.uiManager.showError === 'function') {
          this.uiManager.showError('Initialization Error', 'Failed to initialize the application. Please refresh the page and try again.');
        }
      } catch (uiError) {
        console.error('Failed to show error message:', uiError);
      }
    }
  }
  async initAPIFactory() {
    try {
      await (0, _apiFactory.initAPIFactory)(this.logger, this.settingsManager);
      console.log('✅ API Factory initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize API Factory:', error);
      throw error;
    }
  }

  /**
   * Generic population loader for any dropdown by ID
   */
  async loadPopulationsForDropdown(dropdownId) {
    const select = document.getElementById(dropdownId);
    if (select) {
      select.disabled = true;
      select.innerHTML = '<option value="">Loading populations...</option>';
    }
    this.hidePopulationRetryButton(dropdownId);
    try {
      console.log(`🔄 Loading populations for dropdown: ${dropdownId}`);
      if (!this.localClient) {
        throw new Error('Internal error: API client unavailable');
      }
      const response = await this.localClient.get('/api/pingone/populations');
      console.log(`📋 Populations API response:`, response);
      if (Array.isArray(response)) {
        console.log(`✅ Loaded ${response.length} populations for ${dropdownId}`);
        this.populatePopulationDropdown(dropdownId, response);
        this.hidePopulationRetryButton(dropdownId);

        // Update button state after loading populations
        if (dropdownId === 'import-population-select') {
          this.updateImportButtonState();
        }
      } else {
        console.error(`❌ Invalid response format for populations:`, response);
        this.showPopulationLoadError(dropdownId, 'Invalid response format from server');
      }
    } catch (error) {
      console.error(`❌ Failed to load populations for ${dropdownId}:`, error);
      const errorMessage = error && error.message ? error.message : 'Failed to load populations';
      this.showPopulationLoadError(dropdownId, errorMessage);

      // Log additional debug information
      if (this.logger) {
        this.logger.error('Population loading failed', {
          dropdownId,
          error: error.message,
          stack: error.stack
        });
      }
    }
  }

  /**
   * Populate a dropdown with populations
   */
  populatePopulationDropdown(dropdownId, populations) {
    const select = document.getElementById(dropdownId);
    if (!select) return;
    select.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select a population...';
    select.appendChild(defaultOption);
    populations.forEach(population => {
      const option = document.createElement('option');
      option.value = population.id;
      option.textContent = population.name;
      select.appendChild(option);
    });
    select.disabled = false;
    // Attach change listener if needed (only for main import)
    if (dropdownId === 'import-population-select') {
      this.attachPopulationChangeListener();
      this.updateImportButtonState();
    }
  }

  /**
   * Show error and retry for a dropdown
   */
  showPopulationLoadError(dropdownId, message) {
    const select = document.getElementById(dropdownId);
    if (select) {
      select.innerHTML = `<option value="">${message || 'Failed to load populations'}</option>`;
      select.disabled = true;
    }
    this.showPopulationRetryButton(dropdownId);
    if (dropdownId === 'import-population-select') {
      this.uiManager.showError('Failed to load populations', message || 'Please check your PingOne connection and try again.');
    }
  }

  /**
   * Show retry button for a dropdown
   */
  showPopulationRetryButton(dropdownId) {
    const retryId = `retry-${dropdownId}`;
    let retryBtn = document.getElementById(retryId);
    if (!retryBtn) {
      retryBtn = document.createElement('button');
      retryBtn.id = retryId;
      retryBtn.textContent = 'Retry';
      retryBtn.className = 'btn btn-secondary';
      retryBtn.style.marginTop = '10px';
      const parent = document.getElementById(dropdownId)?.parentElement;
      if (parent) parent.appendChild(retryBtn);
    }
    retryBtn.onclick = () => {
      retryBtn.disabled = true;
      this.loadPopulationsForDropdown(dropdownId);
    };
    retryBtn.style.display = 'inline-block';
  }

  /**
   * Hide retry button for a dropdown
   */
  hidePopulationRetryButton(dropdownId) {
    const retryBtn = document.getElementById(`retry-${dropdownId}`);
    if (retryBtn) retryBtn.style.display = 'none';
  }

  // Update all usages to use the generic loader
  async loadPopulations() {
    await this.loadPopulationsForDropdown('import-population-select');
  }
  // For dashboard, delete, modify, and main population select
  async loadAllPopulationDropdowns() {
    await Promise.all([this.loadPopulationsForDropdown('import-population-select'), this.loadPopulationsForDropdown('dashboard-population-select'), this.loadPopulationsForDropdown('delete-population-select'), this.loadPopulationsForDropdown('modify-population-select')]);
  }
  updateImportButtonState() {
    try {
      const populationSelect = document.getElementById('import-population-select');
      const hasFile = this.fileHandler && this.fileHandler.getCurrentFile() !== null;

      // Validate file handler exists
      if (!this.fileHandler) {
        console.warn('File handler not initialized');
      }

      // Check both the dropdown value and the stored properties
      const dropdownValue = populationSelect ? populationSelect.value : '';
      const storedPopulationId = this.selectedPopulationId || '';
      const hasPopulation = dropdownValue && dropdownValue !== '' || storedPopulationId && storedPopulationId !== '';

      // Production logging (reduced verbosity)
      if (window.DEBUG_MODE) {
        console.log('=== Update Import Button State ===');
        console.log('Has file:', hasFile);
        console.log('Has population:', hasPopulation);
        console.log('Dropdown value:', dropdownValue);
        console.log('Stored population ID:', storedPopulationId);
        console.log('Stored population name:', this.selectedPopulationName);
        console.log('Population select element exists:', !!populationSelect);
        console.log('====================================');
      }

      // Get import button with validation (only one exists in HTML)
      const importBtn = document.getElementById('start-import');
      const shouldEnable = hasFile && hasPopulation;

      // Safely update button state
      if (importBtn && typeof importBtn.disabled !== 'undefined') {
        importBtn.disabled = !shouldEnable;
      }
      if (window.DEBUG_MODE) {
        console.log('Import buttons enabled:', shouldEnable);
      }

      // Update population display in import stats if available
      if (hasPopulation) {
        const populationNameElement = document.getElementById('import-population-name');
        const populationIdElement = document.getElementById('import-population-id');
        if (populationNameElement && typeof populationNameElement.textContent !== 'undefined') {
          populationNameElement.textContent = this.selectedPopulationName || populationSelect?.selectedOptions[0]?.text || 'Selected';
        }
        if (populationIdElement && typeof populationIdElement.textContent !== 'undefined') {
          populationIdElement.textContent = this.selectedPopulationId || dropdownValue || 'Set';
        }
      }

      // At the end, show the population prompt if needed
      this.showPopulationChoicePrompt();
    } catch (error) {
      console.error('Error updating import button state:', error);
      // Fallback: disable button on error
      const importBtn = document.getElementById('start-import');
      if (importBtn && typeof importBtn.disabled !== 'undefined') {
        importBtn.disabled = true;
      }
    }
  }
  updateModifyButtonState() {
    try {
      const populationSelect = document.getElementById('modify-population-select');
      const hasFile = this.fileHandler && this.fileHandler.getCurrentFile() !== null;

      // Validate file handler exists
      if (!this.fileHandler) {
        console.warn('File handler not initialized');
      }

      // Check both the dropdown value and the stored properties
      const dropdownValue = populationSelect ? populationSelect.value : '';
      const hasPopulation = dropdownValue && dropdownValue !== '';

      // Production logging (reduced verbosity)
      if (window.DEBUG_MODE) {
        console.log('=== Update Modify Button State ===');
        console.log('Has file:', hasFile);
        console.log('Has population:', hasPopulation);
        console.log('Dropdown value:', dropdownValue);
        console.log('Population select element exists:', !!populationSelect);
        console.log('====================================');
      }

      // Get modify button with validation
      const modifyBtn = document.getElementById('start-modify');
      const shouldEnable = hasFile && hasPopulation;

      // Safely update button state
      if (modifyBtn && typeof modifyBtn.disabled !== 'undefined') {
        modifyBtn.disabled = !shouldEnable;
      }
      if (window.DEBUG_MODE) {
        console.log('Modify button enabled:', shouldEnable);
      }
    } catch (error) {
      console.error('Error updating modify button state:', error);
      // Fallback: disable button on error
      const modifyBtn = document.getElementById('start-modify');
      if (modifyBtn && typeof modifyBtn.disabled !== 'undefined') {
        modifyBtn.disabled = true;
      }
    }
  }
  async loadSettings() {
    try {
      // First try to load from server
      const response = await this.localClient.get('/api/settings');
      if (response.success && response.data) {
        // Convert kebab-case to camelCase for the form
        let populationId = response.data['population-id'] || '';
        if (populationId === 'not set') populationId = '';
        const settings = {
          environmentId: response.data['environment-id'] || '',
          apiClientId: response.data['api-client-id'] || '',
          apiSecret: response.data['api-secret'] || '',
          populationId,
          region: response.data['region'] || 'NorthAmerica',
          rateLimit: response.data['rate-limit'] || 90
        };
        this.populateSettingsForm(settings);
        this.logger.info('Settings loaded from server and populated into form');

        // Show current token status if PingOneClient is available
        if (this.pingOneClient) {
          const tokenInfo = this.pingOneClient.getCurrentTokenTimeRemaining();
          this.uiManager.showCurrentTokenStatus(tokenInfo);
          if (window.DEBUG_MODE) {
            console.log('Current token status:', tokenInfo);
          }
        }
      } else {
        // Fallback to localStorage if server settings not available
        this.logger.warn('No server settings found, trying localStorage...');
        try {
          const localSettings = await this.settingsManager.loadSettings();
          if (localSettings && Object.keys(localSettings).length > 0) {
            this.populateSettingsForm(localSettings);
            this.logger.info('Settings loaded from localStorage and populated into form');
          } else {
            this.logger.info('No settings found in localStorage, using defaults');
          }
        } catch (localError) {
          this.logger.error('Failed to load settings from localStorage:', localError);
        }
      }
    } catch (error) {
      this.logger.error('Failed to load settings from server, trying localStorage...');
      try {
        const localSettings = await this.settingsManager.loadSettings();
        if (localSettings && Object.keys(localSettings).length > 0) {
          this.populateSettingsForm(localSettings);
          this.logger.info('Settings loaded from localStorage (fallback) and populated into form');
        } else {
          this.logger.info('No settings found in localStorage, using defaults');
        }
      } catch (localError) {
        this.logger.error('Failed to load settings from localStorage:', localError);
      }
    }
  }
  setupEventListeners() {
    // File upload event listeners
    const csvFileInput = document.getElementById('csv-file');
    if (csvFileInput) {
      csvFileInput.addEventListener('change', event => {
        const file = event.target.files[0];
        if (file) {
          this.handleFileSelect(file);
        }
      });
    }

    // Modify file upload event listeners
    const modifyCsvFileInput = document.getElementById('modify-csv-file');
    if (modifyCsvFileInput) {
      modifyCsvFileInput.addEventListener('change', event => {
        const file = event.target.files[0];
        if (file) {
          this.handleModifyFileSelect(file);
        }
      });
    }

    // Modify drop zone event listeners
    const modifyDropZone = document.getElementById('modify-drop-zone');
    if (modifyDropZone) {
      // Prevent default drag behaviors
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        modifyDropZone.addEventListener(eventName, e => {
          e.preventDefault();
          e.stopPropagation();
        });
      });

      // Add visual feedback for drag over
      ['dragenter', 'dragover'].forEach(eventName => {
        modifyDropZone.addEventListener(eventName, () => {
          modifyDropZone.classList.add('drag-over');
        });
      });
      ['dragleave', 'drop'].forEach(eventName => {
        modifyDropZone.addEventListener(eventName, () => {
          modifyDropZone.classList.remove('drag-over');
        });
      });

      // Handle file drop
      modifyDropZone.addEventListener('drop', e => {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          this.handleModifyFileSelect(files[0]);
          // Update the file input
          modifyCsvFileInput.files = files;
        }
      });

      // Handle click to open file picker
      modifyDropZone.addEventListener('click', () => {
        modifyCsvFileInput.click();
      });
    }

    // Population selection change listener
    this.attachPopulationChangeListener();

    // Modify population selection change listener
    const modifyPopulationSelect = document.getElementById('modify-population-select');
    if (modifyPopulationSelect) {
      modifyPopulationSelect.addEventListener('change', e => {
        const selectedPopulationId = e.target.value;
        const selectedPopulationName = e.target.selectedOptions[0]?.text || '';
        console.log('=== Modify Population Selection Changed ===');
        console.log('Selected Population ID:', selectedPopulationId);
        console.log('Selected Population Name:', selectedPopulationName);
        console.log('====================================');

        // Update the modify button state based on population selection
        this.updateModifyButtonState();
      });
    }

    // Import event listeners with error handling
    const startImportBtn = document.getElementById('start-import');
    if (startImportBtn) {
      startImportBtn.addEventListener('click', async e => {
        try {
          e.preventDefault();
          e.stopPropagation();
          await this.startImport();
        } catch (error) {
          console.error('Error in start import handler:', error);
          if (this.uiManager && typeof this.uiManager.showError === 'function') {
            this.uiManager.showError('Import Error', 'Failed to start import. Please try again.');
          }
        }
      });
    }
    const cancelImportBtn = document.getElementById('cancel-import-btn');
    if (cancelImportBtn) {
      cancelImportBtn.addEventListener('click', e => {
        e.preventDefault();
        this.cancelImport();
      });
    }
    const cancelImportBtnBottom = document.getElementById('cancel-import-btn-bottom');
    if (cancelImportBtnBottom) {
      cancelImportBtnBottom.addEventListener('click', e => {
        e.preventDefault();
        this.cancelImport();
      });
    }

    // Export event listeners
    const startExportBtn = document.getElementById('start-export-btn');
    if (startExportBtn) {
      startExportBtn.addEventListener('click', async e => {
        e.preventDefault();
        await this.startExport();
      });
    }
    const cancelExportBtn = document.getElementById('cancel-export-btn');
    if (cancelExportBtn) {
      cancelExportBtn.addEventListener('click', e => {
        e.preventDefault();
        this.cancelExport();
      });
    }

    // Delete event listeners
    const startDeleteBtn = document.getElementById('start-delete-btn');
    if (startDeleteBtn) {
      startDeleteBtn.addEventListener('click', async e => {
        e.preventDefault();
        await this.startDelete();
      });
    }
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    if (cancelDeleteBtn) {
      cancelDeleteBtn.addEventListener('click', e => {
        e.preventDefault();
        this.cancelDelete();
      });
    }

    // Modify event listeners
    const startModifyBtn = document.getElementById('start-modify-btn');
    if (startModifyBtn) {
      startModifyBtn.addEventListener('click', async e => {
        e.preventDefault();
        await this.startModify();
      });
    }
    const cancelModifyBtn = document.getElementById('cancel-modify-btn');
    if (cancelModifyBtn) {
      cancelModifyBtn.addEventListener('click', e => {
        e.preventDefault();
        this.cancelModify();
      });
    }

    // Population delete event listeners
    const startPopulationDeleteBtn = document.getElementById('start-population-delete-btn');
    if (startPopulationDeleteBtn) {
      startPopulationDeleteBtn.addEventListener('click', async e => {
        e.preventDefault();
        await this.startPopulationDelete();
      });
    }
    const cancelPopulationDeleteBtn = document.getElementById('cancel-population-delete-btn');
    if (cancelPopulationDeleteBtn) {
      cancelPopulationDeleteBtn.addEventListener('click', e => {
        e.preventDefault();
        this.cancelPopulationDelete();
      });
    }

    // Settings form event listeners
    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
      settingsForm.addEventListener('submit', async e => {
        e.preventDefault();
        const formData = new FormData(settingsForm);

        // Get API secret from SecretFieldManager
        const apiSecret = this.secretFieldToggle.getValue();
        const settings = {
          environmentId: formData.get('environment-id'),
          apiClientId: formData.get('api-client-id'),
          apiSecret: apiSecret,
          populationId: formData.get('population-id'),
          region: formData.get('region'),
          rateLimit: parseInt(formData.get('rate-limit')) || 90
        };
        await this.handleSaveSettings(settings);
      });
    }

    // Save settings button event listener
    const saveSettingsBtn = document.getElementById('save-settings');
    if (saveSettingsBtn) {
      saveSettingsBtn.addEventListener('click', async e => {
        e.preventDefault();

        // Get form data
        const formData = new FormData(settingsForm);

        // Get API secret from SecretFieldManager
        const apiSecret = this.secretFieldToggle.getValue();
        const settings = {
          environmentId: formData.get('environment-id'),
          apiClientId: formData.get('api-client-id'),
          apiSecret: apiSecret,
          populationId: formData.get('population-id'),
          region: formData.get('region'),
          rateLimit: parseInt(formData.get('rate-limit')) || 90
        };
        await this.handleSaveSettings(settings);
      });
    }

    // Test connection button
    const testConnectionBtn = document.getElementById('test-connection-btn');
    if (testConnectionBtn) {
      testConnectionBtn.addEventListener('click', async e => {
        e.preventDefault();
        await this.testConnection();
      });
    }

    // Population dropdown event listener
    const populationSelect = document.getElementById('import-population-select');
    if (populationSelect) {
      console.log('Setting up population select event listener...');
      populationSelect.addEventListener('change', e => {
        const selectedPopulationId = e.target.value;
        const selectedPopulationName = e.target.selectedOptions[0]?.text || '';
        console.log('=== Population Selection Changed ===');
        console.log('Selected Population ID:', selectedPopulationId);
        console.log('Selected Population Name:', selectedPopulationName);
        console.log('Event target:', e.target);
        console.log('All options:', Array.from(e.target.options).map(opt => ({
          value: opt.value,
          text: opt.text,
          selected: opt.selected
        })));
        console.log('====================================');

        // Update the import button state based on population selection
        this.updateImportButtonState();

        // Scrolls user to Import button immediately after selecting a population to ensure visibility of next action
        if (selectedPopulationId && selectedPopulationId !== '') {
          let attempts = 0;
          const maxAttempts = 10;
          const scrollToImportButton = () => {
            const importButton = document.getElementById('start-import-btn');
            if (importButton) {
              importButton.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest'
              });
              console.log('[Population Select] ✅ Scrolled to Import button smoothly');
            } else if (attempts < maxAttempts) {
              attempts++;
              setTimeout(scrollToImportButton, 50);
            } else {
              // Only log a warning if the button is expected in this view
              if (document.body.contains(document.getElementById('import-section'))) {
                console.warn('[Population Select] Import button not found for scrolling');
              }
            }
          };
          scrollToImportButton();
        }
      });
    } else {
      console.warn('Population select element not found in DOM');
    }

    // Get token button
    const getTokenBtn = document.getElementById('get-token-quick');
    if (getTokenBtn) {
      console.log('Setting up Get Token button event listener...');
      getTokenBtn.addEventListener('click', async e => {
        console.log('Get Token button clicked!');
        e.preventDefault();
        e.stopPropagation();
        await this.getToken();
      });
    } else {
      console.warn('Get Token button not found in DOM');
    }

    // Navigation event listeners
    const navItems = document.querySelectorAll('[data-view]');
    navItems.forEach(item => {
      item.addEventListener('click', async e => {
        e.preventDefault();
        const view = item.getAttribute('data-view');
        await this.showView(view);
      });
    });

    // Feature flags panel toggle - Enhanced with full functionality
    const featureFlagsToggle = document.getElementById('feature-flags-toggle');
    if (featureFlagsToggle) {
      featureFlagsToggle.addEventListener('click', () => {
        const panel = document.getElementById('feature-flags-panel');
        if (panel) {
          panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
      });
    }

    // Feature flag toggles - Enhanced with data attributes
    const featureFlagToggles = document.querySelectorAll('[data-feature-flag]');
    featureFlagToggles.forEach(toggle => {
      toggle.addEventListener('change', async e => {
        const flag = e.target.getAttribute('data-feature-flag');
        const enabled = e.target.checked;
        await this.toggleFeatureFlag(flag, enabled);
      });
    });

    // Feature flags close button - Prevents user confusion due to broken UI controls
    const closeFeatureFlagsBtn = document.getElementById('close-feature-flags');
    if (closeFeatureFlagsBtn) {
      closeFeatureFlagsBtn.addEventListener('click', () => {
        const panel = document.getElementById('feature-flags-panel');
        if (panel) {
          panel.style.display = 'none';
        }
      });
    }

    // Feature flags reset button - Ensures visibility and full control of feature flags for debugging and configuration
    const resetFeatureFlagsBtn = document.getElementById('reset-feature-flags');
    if (resetFeatureFlagsBtn) {
      resetFeatureFlagsBtn.addEventListener('click', async () => {
        try {
          await this.resetFeatureFlags();
          this.showFeatureFlagsStatus('All feature flags reset to defaults', 'success');
        } catch (error) {
          this.showFeatureFlagsStatus('Failed to reset feature flags', 'error');
        }
      });
    }

    // Add new feature flag functionality
    const addFeatureFlagBtn = document.getElementById('add-feature-flag');
    if (addFeatureFlagBtn) {
      addFeatureFlagBtn.addEventListener('click', async () => {
        await this.addNewFeatureFlag();
      });
    }

    // Import progress close button
    const closeImportStatusBtn = document.getElementById('close-import-status');
    if (closeImportStatusBtn) {
      closeImportStatusBtn.addEventListener('click', e => {
        e.preventDefault();
        const importStatus = document.getElementById('import-status');
        if (importStatus) {
          importStatus.style.display = 'none';
        }
      });
    }

    // Home button in history view
    const goHomeFromHistoryBtn = document.getElementById('go-home-from-history');
    if (goHomeFromHistoryBtn) {
      goHomeFromHistoryBtn.addEventListener('click', e => {
        e.preventDefault();
        this.showView('home');
      });
    }
  }
  async checkServerConnectionStatus() {
    try {
      console.log('🔄 Starting server connection check...');
      const response = await this.localClient.get('/api/health');
      console.log('✅ Health check response received:', response);

      // The localClient.get() returns the response data directly, not wrapped in a data property
      // Handle the response structure correctly
      const responseData = response || {};
      const serverInfo = responseData?.server || {};
      const checks = responseData?.checks || {};
      console.log('📊 Parsed response data:', {
        responseData,
        serverInfo,
        checks
      });

      // Safely extract pingOne status with multiple fallback paths
      const pingOneInitialized = serverInfo?.pingOneInitialized || serverInfo?.pingOne?.initialized || checks?.pingOneConnected === 'ok' || false;

      // Additional check: if pingOneConnected is 'ok', consider it initialized
      const isConnected = checks?.pingOneConnected === 'ok';

      // Safely extract error information with multiple fallback paths
      const lastError = serverInfo?.lastError || serverInfo?.error || checks?.pingOneConfigured === 'error' ? 'Configuration error' : null || null;
      console.log('🔍 Status analysis:', {
        pingOneInitialized,
        lastError,
        checks
      });
      if (pingOneInitialized || isConnected) {
        this.safeLogger.info('Server is connected to PingOne');
        this.uiManager.updateConnectionStatus('connected', 'Connected to PingOne');

        // Check if we have a valid cached token before hiding home token status
        let hasValidToken = false;
        if (this.pingOneClient && typeof this.pingOneClient.getCachedToken === 'function') {
          const cachedToken = this.pingOneClient.getCachedToken();
          if (cachedToken) {
            if (typeof localStorage !== 'undefined') {
              const expiry = localStorage.getItem('pingone_token_expiry');
              if (expiry) {
                const expiryTime = parseInt(expiry);
                if (Date.now() < expiryTime) {
                  hasValidToken = true;
                }
              }
            }
          }
        } else if (this.pingOneClient) {
          this.safeLogger.warn('pingOneClient.getCachedToken is not a function', this.pingOneClient);
        }
        if (hasValidToken) {
          this.uiManager.updateHomeTokenStatus(false);
        } else {
          this.uiManager.updateHomeTokenStatus(true, 'You need to configure your PingOne API credentials and get a token before using this tool.');
        }
        return true;
      } else {
        const errorMessage = lastError || 'Not connected to PingOne';
        this.safeLogger.warn('Server is not connected to PingOne', {
          error: errorMessage
        });
        this.uiManager.updateConnectionStatus('disconnected', errorMessage);

        // Check if we have a valid cached token before showing home token status
        hasValidToken = false;
        if (this.pingOneClient && typeof this.pingOneClient.getCachedToken === 'function') {
          const cachedToken = this.pingOneClient.getCachedToken();
          if (cachedToken) {
            if (typeof localStorage !== 'undefined') {
              const expiry = localStorage.getItem('pingone_token_expiry');
              if (expiry) {
                const expiryTime = parseInt(expiry);
                if (Date.now() < expiryTime) {
                  hasValidToken = true;
                }
              }
            }
          }
        } else if (this.pingOneClient) {
          this.safeLogger.warn('pingOneClient.getCachedToken is not a function', this.pingOneClient);
        }
        if (hasValidToken) {
          this.uiManager.updateHomeTokenStatus(false);
        } else {
          this.uiManager.updateHomeTokenStatus(true, 'You need to configure your PingOne API credentials and get a token before using this tool.');
        }
        return false;
      }
    } catch (error) {
      // Handle network errors, malformed responses, or server unavailability
      const errorMessage = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
      const statusMessage = `Failed to check server status: ${errorMessage}`;

      // Always log as a string
      console.error('❌ Server connection check failed:', errorMessage);
      this.safeLogger.error('Server connection check failed', errorMessage);
      this.uiManager.updateConnectionStatus('error', statusMessage);

      // Check if we have a valid cached token before showing home token status
      hasValidToken = false;
      if (this.pingOneClient && typeof this.pingOneClient.getCachedToken === 'function') {
        const cachedToken = this.pingOneClient.getCachedToken();
        if (cachedToken) {
          if (typeof localStorage !== 'undefined') {
            const expiry = localStorage.getItem('pingone_token_expiry');
            if (expiry) {
              const expiryTime = parseInt(expiry);
              if (Date.now() < expiryTime) {
                hasValidToken = true;
              }
            }
          }
        }
      } else if (this.pingOneClient) {
        this.safeLogger.warn('pingOneClient.getCachedToken is not a function', this.pingOneClient);
      }
      if (hasValidToken) {
        this.uiManager.updateHomeTokenStatus(false);
      } else {
        this.uiManager.updateHomeTokenStatus(true, 'You need to configure your PingOne API credentials and get a token before using this tool.');
      }
      return false;
    }
  }

  /**
   * Check if a feature is enabled based on feature flags
   * 
   * @param {string} feature - The feature to check
   * @returns {Promise<boolean>} - Whether the feature is enabled
   */
  async isFeatureEnabled(feature) {
    try {
      const response = await this.localClient.get('/api/feature-flags');
      const flags = response || {};
      return !!flags[feature];
    } catch (error) {
      console.warn(`Failed to check feature flag ${feature}:`, error);
      return false; // Default to disabled on error
    }
  }

  // UI for progress page is temporarily removed. 
  // Controlled by backend feature flag: progressPage
  // To re-enable: set FEATURE_FLAG_PROGRESS_PAGE=true in environment

  /**
   * Show view with feature flag validation
   * 
   * @param {string} view - The view to show
   */
  async showView(view) {
    if (!view) return;

    // Hide all views with safe iteration
    const views = document.querySelectorAll('.view');
    if (views && views.length > 0) {
      views.forEach(v => {
        if (v && v.style) {
          v.style.display = 'none';
        }
      });
    }

    // Show selected view
    const selectedView = document.getElementById(`${view}-view`);
    if (selectedView) {
      selectedView.style.display = 'block';
      this.currentView = view;

      // Handle universal token status visibility
      this.handleTokenStatusVisibility(view);

      // Load settings when navigating to settings view
      if (view === 'settings') {
        this.loadSettings();
        this.uiManager.updateSettingsSaveStatus('Please configure your API credentials and test the connection.', 'info');
      }

      // Load populations when navigating to import view
      if (view === 'import') {
        console.log('🔄 Navigating to import view, loading populations...');
        this.loadPopulations();
      }

      // Update navigation with safe navItems handling
      this.updateNavigationActiveState(view);

      // Update universal token status when switching views
      this.updateUniversalTokenStatus();
    }
  }

  /**
   * Safely update navigation active state
   * 
   * Handles navigation item updates with proper null checks and fallbacks.
   * Prevents crashes when navItems is undefined or DOM elements are missing.
   * 
   * @param {string} view - The current view being displayed
   */
  updateNavigationActiveState(view) {
    try {
      // Get navItems safely with fallback
      let navItems = [];

      // Try to get navItems from UIManager first
      if (this.uiManager && this.uiManager.navItems) {
        navItems = this.uiManager.navItems;
      } else {
        // Fallback to direct DOM query
        navItems = document.querySelectorAll('[data-view]');
      }

      // Ensure navItems is an array-like object before iterating
      if (navItems && navItems.length > 0) {
        navItems.forEach(item => {
          if (item && item.classList) {
            item.classList.remove('active');
            if (item.getAttribute('data-view') === view) {
              item.classList.add('active');
            }
          }
        });
      } else {
        // Log warning if no navigation items found
        this.logger?.warn('No navigation items found for view update', {
          view
        });
      }
    } catch (error) {
      // Log error but don't crash the app
      console.error('Error updating navigation state:', error);
      this.logger?.error('Failed to update navigation state', {
        error: error.message,
        view
      });
    }
  }

  /**
   * Handle token status visibility based on current view
   * 
   * Controls when the universal token status bar should be visible
   * based on the current page. This ensures users see token status
   * on functional pages but not on the home page with disclaimer.
   * 
   * @param {string} view - The current view being displayed
   */
  handleTokenStatusVisibility(view) {
    try {
      const tokenStatusBar = document.getElementById('universal-token-status');
      if (!tokenStatusBar) return;

      // Hide token status on home page (disclaimer page)
      if (view === 'home') {
        tokenStatusBar.style.display = 'none';
      } else {
        // Show token status on all other pages
        tokenStatusBar.style.display = 'block';
      }
    } catch (error) {
      console.error('Error handling token status visibility:', error);
    }
  }
  async handleSaveSettings(settings) {
    try {
      this.logger.info('Saving settings', settings);

      // Show saving status using new enhanced status field
      this.uiManager.showSettingsActionStatus('Saving settings...', 'info');

      // Just save settings without testing connections
      const response = await this.localClient.post('/api/settings', settings);

      // Update settings manager
      this.settingsManager.updateSettings(settings);

      // Update API clients with new settings
      this.pingOneClient = _apiFactory.apiFactory.getPingOneClient(this.logger, this.settingsManager);

      // Show success status using new enhanced status field
      this.uiManager.showSettingsActionStatus('Settings saved successfully', 'success', {
        autoHideDelay: 3000
      });

      // Show green notification
      this.uiManager.showSuccess('Settings saved for PingOne');

      // Repopulate the form (if needed)
      this.populateSettingsForm(settings);

      // Now update connection status area with check mark and message
      const connStatus = document.getElementById('settings-connection-status');
      if (connStatus) {
        connStatus.textContent = '✅ Settings saved! Please - Get token';
        connStatus.classList.remove('status-disconnected', 'status-error');
        connStatus.classList.add('status-success');
        console.log('Updated #settings-connection-status after save (post-populate)');
      }
    } catch (error) {
      this.logger.error('Failed to save settings', {
        error: error.message
      });
      this.uiManager.showSettingsActionStatus('Failed to save settings: ' + error.message, 'error', {
        autoHide: false
      });
    }
  }
  populateSettingsForm(settings) {
    if (!settings) {
      this.logger.warn('No settings provided to populate form');
      return;
    }
    const fields = {
      'environment-id': settings.environmentId || '',
      'api-client-id': settings.apiClientId || '',
      'api-secret': settings.apiSecret || '',
      'population-id': settings.populationId || '',
      'region': settings.region || 'NorthAmerica',
      'rate-limit': settings.rateLimit || 90
    };
    const missingFields = [];
    for (const [id, value] of Object.entries(fields)) {
      try {
        const element = document.getElementById(id);
        if (!element) {
          missingFields.push(id);
          continue;
        }

        // Handle API secret using SecretFieldManager
        if (id === 'api-secret') {
          this.secretFieldToggle.setValue(value);
        } else {
          element.value = value;
        }
      } catch (error) {
        this.logger.error(`Error setting field ${id}`, {
          error: error.message
        });
        missingFields.push(id);
      }
    }
    if (missingFields.length > 0) {
      this.logger.warn('Missing form fields', {
        missingFields
      });
    }
  }

  // Helper: Validate UUID v4
  isValidUUID(uuid) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
  }

  /**
   * Handles file selection from the UI, parses CSV, and triggers population conflict logic if needed
   * @param {File} file - The selected CSV file
   */
  async handleFileSelect(file) {
    try {
      // Log file selection for debugging
      this.uiManager.debugLog("FileUpload", `File selected: ${file.name}, size: ${file.size}`);
      await this.fileHandler.setFile(file);
      this.uiManager.showSuccess('File selected successfully', `Selected file: ${file.name}`);
      // Update import button state after file selection
      this.updateImportButtonState();

      // --- ALWAYS IGNORE CSV POPULATION DATA ---
      // Get users from CSV for logging purposes only
      const users = this.fileHandler.getParsedUsers ? this.fileHandler.getParsedUsers() : [];
      // Log number of users parsed from CSV
      this.uiManager.debugLog("CSV", `Parsed ${users.length} users from CSV`);

      // Get selected population from UI dropdown
      const populationSelect = document.getElementById('import-population-select');
      const uiPopulationId = populationSelect && populationSelect.value;

      // Log selected population
      this.uiManager.debugLog("Population", `Selected population: ${uiPopulationId}`);

      // ALWAYS use UI population selection and ignore any CSV population data
      if (uiPopulationId) {
        // Overwrite all user records with UI populationId, ignoring any CSV population data
        users.forEach(u => {
          // Remove any existing population data from CSV
          delete u.populationId;
          delete u.population_id;
          delete u.populationName;
          delete u.population_name;

          // Set the UI-selected population
          u.populationId = uiPopulationId;
        });
        this.populationChoice = 'ui';
        this.uiManager.showInfo('Using UI dropdown population selection (CSV population data ignored)');

        // Log the population assignment
        this.uiManager.debugLog("Population", `Assigned UI population ${uiPopulationId} to all ${users.length} users`);
      } else {
        // No UI population selected - this will be handled by validation later
        this.populationChoice = 'ui';
        this.uiManager.showWarning('No population selected in UI dropdown');
      }

      // Show population prompt if needed (legacy)
      this.showPopulationChoicePrompt();
    } catch (error) {
      this.uiManager.showError('Failed to select file', error.message);
    }
  }

  /**
   * Handles modify file selection from the UI, parses CSV, and updates file information display
   * @param {File} file - The selected CSV file for modification
   */
  async handleModifyFileSelect(file) {
    try {
      // Log file selection for debugging
      this.uiManager.debugLog("ModifyFileUpload", `Modify file selected: ${file.name}, size: ${file.size}`);
      await this.fileHandler.setFile(file, 'modify');
      this.uiManager.showSuccess('File selected successfully', `Selected file: ${file.name} for modification`);

      // Update modify button state after file selection
      this.updateModifyButtonState();

      // Get users from CSV for logging purposes
      const users = this.fileHandler.getParsedUsers ? this.fileHandler.getParsedUsers() : [];
      this.uiManager.debugLog("ModifyCSV", `Parsed ${users.length} users from CSV for modification`);

      // Get selected population from UI dropdown
      const populationSelect = document.getElementById('modify-population-select');
      const uiPopulationId = populationSelect && populationSelect.value;

      // Log selected population
      this.uiManager.debugLog("ModifyPopulation", `Selected population: ${uiPopulationId}`);

      // Use UI population selection for modify operation
      if (uiPopulationId) {
        // Overwrite all user records with UI populationId
        users.forEach(u => {
          // Remove any existing population data from CSV
          delete u.populationId;
          delete u.population_id;
          delete u.populationName;
          delete u.population_name;

          // Set the UI-selected population
          u.populationId = uiPopulationId;
        });
        this.uiManager.showInfo('Using UI dropdown population selection for modification');

        // Log the population assignment
        this.uiManager.debugLog("ModifyPopulation", `Assigned UI population ${uiPopulationId} to all ${users.length} users for modification`);
      } else {
        this.uiManager.showWarning('No population selected in UI dropdown for modification');
      }
    } catch (error) {
      this.uiManager.showError('Failed to select file for modification', error.message);
    }
  }

  /**
   * Starts the user import flow with real-time progress tracking
   * 
   * Validates user inputs, sends CSV data to the server, and establishes
   * a Server-Sent Events (SSE) connection for real-time progress updates.
   * Handles error states, retry logic, and user feedback throughout the process.
   * 
   * @returns {Promise<void>}
   */
  async startImport() {
    // Check for valid token before proceeding
    const hasValidToken = await this.checkTokenAndRedirect('import');
    if (!hasValidToken) {
      console.log('❌ [IMPORT] Import cancelled due to missing valid token');
      return;
    }

    // Prevent multiple simultaneous imports
    if (this.isImporting) {
      this.logger.warn('Import already in progress');
      return;
    }

    // Enhanced logging for import start
    console.log('🚀 [IMPORT] Starting import process');
    this.logger.info('Starting import process');

    // Fetch selected population name and ID from dropdown
    const popSelect = document.getElementById('import-population-select');
    let populationId = popSelect && popSelect.value ? popSelect.value : '';
    let populationName = '';
    if (popSelect) {
      const selectedOption = popSelect.options[popSelect.selectedIndex];
      populationName = selectedOption ? selectedOption.text : '';
    }

    // Debug logging for population selection
    console.log('🔍 [Population Debug] Dropdown state:', {
      element: popSelect,
      selectedIndex: popSelect ? popSelect.selectedIndex : 'N/A',
      value: populationId,
      text: populationName,
      optionsCount: popSelect ? popSelect.options.length : 0
    });

    // Store for use in progress updates
    this.selectedPopulationId = populationId;
    this.selectedPopulationName = populationName;

    // Debug logging for stored values
    console.log('🔍 [Population Debug] Stored values:', {
      selectedPopulationId: this.selectedPopulationId,
      selectedPopulationName: this.selectedPopulationName
    });

    // Log at import trigger to confirm the correct value is being used
    console.log('🚀 [Import Trigger] Using population:', {
      id: populationId,
      name: populationName
    });

    // Debug warning if population name is "Test"
    if (populationName === 'Test') {
      console.warn('⚠️ [Population Debug] WARNING: Population name is "Test" - this might be a default value');
      console.log('⚠️ [Population Debug] Dropdown state when "Test" selected:', {
        selectedIndex: popSelect ? popSelect.selectedIndex : 'N/A',
        allOptions: popSelect ? Array.from(popSelect.options).map((opt, idx) => ({
          index: idx,
          value: opt.value,
          text: opt.text,
          selected: opt.selected
        })) : []
      });
    }

    // Initialize SSE status indicator and fallback polling
    ensureSSEStatusIndicator();
    this.robustSSE = null;
    this.fallbackPolling = null;

    /**
     * Establishes Socket.IO connection for real-time import progress updates with WebSocket fallback
     * 
     * Uses Socket.IO as primary real-time connection with automatic fallback to WebSocket
     * if Socket.IO fails or disconnects.
     * 
     * @param {string} sessionId - Unique session identifier for this import
     */
    const connectRealTimeProgress = sessionId => {
      // Validate sessionId before attempting connection
      if (!sessionId || typeof sessionId !== 'string' || sessionId.trim() === '') {
        console.error("RealTime: ❌ Invalid sessionId - cannot establish connection", {
          sessionId
        });
        this.uiManager.debugLog("RealTime", "❌ Invalid sessionId - cannot establish connection", {
          sessionId
        });
        this.uiManager.showError('Connection Error', 'Invalid session ID. Cannot establish progress connection.');
        this.isImporting = false;
        return;
      }

      // Log connection attempt for debugging
      console.log("RealTime: 🔌 Establishing Socket.IO connection with sessionId:", sessionId);
      this.uiManager.debugLog("RealTime", `🔄 Establishing Socket.IO connection with sessionId: ${sessionId}`);
      this.uiManager.showInfo(`RealTime: Opening Socket.IO connection with sessionId: ${sessionId}`);

      // Initialize Socket.IO connection
      this.socket = (0, _socket.io)();

      // Socket.IO event handlers
      this.socket.on('connect', () => {
        console.log("Socket.IO: ✅ Connected to server");
        this.uiManager.debugLog("Socket.IO", "✅ Connected to server");
        this.uiManager.showSuccess('Socket.IO: Real-time connection established');

        // Register session with server
        this.socket.emit('registerSession', sessionId);

        // Stop fallback polling if it was active
        if (this.fallbackPolling) {
          stopFallbackPolling();
          this.fallbackPolling = null;
        }
      });
      this.socket.on('progress', data => {
        console.log("Socket.IO: 📩 Progress message received:", data);
        this.uiManager.debugLog("Socket.IO", "📊 Progress message received", data);
        this.handleProgressUpdate(data);
      });
      this.socket.on('completion', data => {
        console.log("Socket.IO: ✅ Completion message received:", data);
        this.uiManager.debugLog("Socket.IO", "✅ Completion message received", data);
        this.handleProgressUpdate(data);
      });
      this.socket.on('error', data => {
        console.log("Socket.IO: ❌ Error message received:", data);
        this.uiManager.debugLog("Socket.IO", "❌ Error message received", data);
        this.handleProgressUpdate(data);
      });

      // Handle Socket.IO disconnection - fallback to WebSocket
      this.socket.on('disconnect', reason => {
        console.log("Socket.IO: 🔄 Disconnected, reason:", reason);
        this.uiManager.debugLog("Socket.IO", `🔄 Disconnected, reason: ${reason}`);
        this.uiManager.showWarning('Socket.IO: Connection lost, switching to WebSocket fallback');

        // Start WebSocket fallback
        this.startWebSocketFallback(sessionId);
      });

      // Handle Socket.IO connection errors - fallback to WebSocket
      this.socket.on('connect_error', error => {
        console.error("Socket.IO: ❌ Connection error:", error);
        this.uiManager.debugLog("Socket.IO", "❌ Connection error", {
          error: error.message
        });
        this.uiManager.showError('Socket.IO Connection Failed', 'Switching to WebSocket fallback');

        // Start WebSocket fallback
        this.startWebSocketFallback(sessionId);
      });
    };

    /**
     * WebSocket fallback for when Socket.IO fails
     * 
     * @param {string} sessionId - Unique session identifier for this import
     */
    this.startWebSocketFallback = sessionId => {
      console.log("WebSocket: 🔌 Starting WebSocket fallback connection");
      this.uiManager.debugLog("WebSocket", "🔄 Starting WebSocket fallback connection");
      this.uiManager.showInfo('WebSocket: Establishing fallback connection');
      try {
        this.ws = new WebSocket(`ws://${window.location.hostname}:${window.location.port || 4000}`);
        this.ws.onopen = () => {
          console.log("WebSocket: ✅ Connected to server");
          this.uiManager.debugLog("WebSocket", "✅ Connected to server");
          this.uiManager.showSuccess('WebSocket: Fallback connection established');

          // Send session ID to register with server
          this.ws.send(JSON.stringify({
            sessionId
          }));
        };
        this.ws.onmessage = event => {
          console.log("WebSocket: 📩 Message received:", event.data);
          this.uiManager.debugLog("WebSocket", "📊 Message received", {
            data: event.data
          });
          try {
            const data = JSON.parse(event.data);
            this.handleProgressUpdate(data);
          } catch (e) {
            console.error("WebSocket: ❌ Failed to parse message:", e.message);
            this.uiManager.debugLog("WebSocket", "❌ Failed to parse message", {
              error: e.message
            });
          }
        };
        this.ws.onerror = error => {
          console.error("WebSocket: ❌ Connection error:", error);
          this.uiManager.debugLog("WebSocket", "❌ Connection error", {
            error: error.message
          });
          this.uiManager.showError('WebSocket Connection Failed', 'All real-time connections failed');

          // Fallback to polling if WebSocket also fails
          if (!this.fallbackPolling) {
            console.log("WebSocket: 🔄 Starting polling fallback");
            this.uiManager.showWarning('WebSocket: Switching to polling fallback');
            const sseUrl = `/api/import/progress/${sessionId}`;
            this.fallbackPolling = startFallbackPolling(sseUrl, progressData => {
              this.handleProgressUpdate(progressData);
            });
          }
        };
        this.ws.onclose = event => {
          console.log("WebSocket: 🔄 Connection closed:", event.code, event.reason);
          this.uiManager.debugLog("WebSocket", "🔄 Connection closed", {
            code: event.code,
            reason: event.reason
          });

          // Fallback to polling if WebSocket closes
          if (!this.fallbackPolling) {
            console.log("WebSocket: 🔄 Starting polling fallback after close");
            this.uiManager.showWarning('WebSocket: Connection closed, switching to polling');
            const sseUrl = `/api/import/progress/${sessionId}`;
            this.fallbackPolling = startFallbackPolling(sseUrl, progressData => {
              this.handleProgressUpdate(progressData);
            });
          }
        };
      } catch (error) {
        console.error("WebSocket: ❌ Failed to create WebSocket connection:", error);
        this.uiManager.debugLog("WebSocket", "❌ Failed to create connection", {
          error: error.message
        });
        this.uiManager.showError('WebSocket Setup Failed', 'WebSocket not supported, using polling fallback');

        // Fallback to polling
        if (!this.fallbackPolling) {
          const sseUrl = `/api/import/progress/${sessionId}`;
          this.fallbackPolling = startFallbackPolling(sseUrl, progressData => {
            this.handleProgressUpdate(progressData);
          });
        }
      }
    };

    /**
    * Handles progress updates from SSE or fallback polling with enhanced progress manager
    * 
    * @param {Object} data - Progress data from server
    */
    this.handleProgressUpdate = data => {
      // Validate required fields in progress data
      if (data.current === undefined || data.total === undefined) {
        console.error("Progress: ❌ Progress event missing required fields:", data);
        this.uiManager.debugLog("Progress", "❌ Progress event missing required fields", data);
        this.uiManager.showError('Progress Error', 'Missing required fields (current/total)');
        return;
      }

      // Log which user is currently being processed
      if (data.user) {
        console.log("Progress: 👤 Processing user:", data.user.username || data.user.email || 'unknown');
        this.uiManager.debugLog("Progress", `👤 Processing user: ${data.user.username || data.user.email || 'unknown'}`);
      }

      // Log progress update with current/total counts
      if (data.current !== undefined && data.total !== undefined) {
        const percentage = Math.round(data.current / data.total * 100);
        console.log(`Progress: 📈 Progress update: ${data.current} of ${data.total} (${percentage}%)`);
        this.uiManager.debugLog("Progress", `📈 Progress update: ${data.current} of ${data.total} (${percentage}%)`);
      }

      // Handle duplicate users with enhanced progress manager
      if (data.duplicates && data.duplicates.length > 0) {
        console.log("Progress: 🔄 Handling duplicate users:", data.duplicates.length);
        this.uiManager.handleDuplicateUsers(data.duplicates, (mode, duplicates) => {
          console.log('🔄 [IMPORT] User chose duplicate handling mode:', mode);
          // Continue import with selected mode
          this.continueImportWithDuplicateMode(mode, duplicates);
        });
      }

      // Update UI with enhanced progress information
      this.uiManager.updateImportProgress(data.current || 0, data.total || 0, data.message || '', data.counts || {}, data.populationName || '', data.populationId || '');

      // Display status message to user if provided
      if (data.message) {
        this.uiManager.showInfo(data.message);
      }

      // Log current user being processed if available
      if (data.user) {
        const userName = data.user.username || data.user.email || 'unknown';
        this.uiManager.showInfo(`Processing: ${userName}`);
      }

      // Handle skipped users with detailed information
      if (data.status === 'skipped' && data.statusDetails) {
        const skipReason = data.statusDetails.reason || 'User already exists';
        const existingUser = data.statusDetails.existingUser;

        // Log detailed skip information
        console.log("Progress: ⚠️ User skipped:", {
          user: data.user,
          reason: skipReason,
          existingUser: existingUser
        });

        // Show warning message with skip details
        let skipMessage = `⚠️ Skipped: ${data.user.username || data.user.email || 'unknown user'}`;
        if (existingUser) {
          skipMessage += ` (exists as ${existingUser.username || existingUser.email} in ${existingUser.population})`;
        } else {
          skipMessage += ` (${skipReason})`;
        }
        this.uiManager.showWarning(skipMessage);

        // Update UI with skip information
        if (data.counts && data.counts.skipped !== undefined) {
          console.log(`Progress: 📊 Skipped count updated: ${data.counts.skipped}`);
          this.uiManager.debugLog("Progress", `📊 Skipped count updated: ${data.counts.skipped}`);
        }
      }

      // Handle completion with enhanced progress manager
      if (data.status === 'complete' || data.current === data.total) {
        console.log("Progress: ✅ Import completed");
        this.uiManager.completeOperation({
          success: data.counts?.success || 0,
          failed: data.counts?.failed || 0,
          skipped: data.counts?.skipped || 0,
          duplicates: data.counts?.duplicates || 0
        });

        // Clean up connections
        if (this.robustSSE) {
          this.robustSSE.close();
          this.robustSSE = null;
        }
        if (this.fallbackPolling) {
          stopFallbackPolling();
          this.fallbackPolling = null;
        }
        this.isImporting = false;
      }

      // Handle errors
      if (data.status === 'error') {
        console.error("Progress: ❌ Import error:", data.error);
        this.uiManager.showError('Import Error', data.error || 'Unknown error');

        // Clean up connections
        if (this.robustSSE) {
          this.robustSSE.close();
          this.robustSSE = null;
        }
        if (this.fallbackPolling) {
          stopFallbackPolling();
          this.fallbackPolling = null;
        }
        this.isImporting = false;
      }
    };
    try {
      // Set import state to prevent multiple simultaneous imports
      this.isImporting = true;
      this.importAbortController = new AbortController();

      // Validate import options (file, population, etc.)
      const importOptions = this.getImportOptions();
      if (!importOptions) {
        console.log('❌ [IMPORT] Import options validation failed');
        this.isImporting = false;
        return;
      }
      console.log('✅ [IMPORT] Import options validated:', {
        totalUsers: importOptions.totalUsers,
        populationId: importOptions.selectedPopulationId,
        populationName: importOptions.selectedPopulationName,
        fileName: importOptions.file?.name
      });

      // Start import operation with enhanced progress manager
      this.uiManager.startImportOperation({
        total: importOptions.totalUsers,
        populationName: importOptions.selectedPopulationName,
        populationId: importOptions.selectedPopulationId,
        fileName: importOptions.file?.name
      });

      // Prepare FormData for file upload to server
      // Includes file, population selection, and metadata
      const formData = new FormData();
      formData.append('file', importOptions.file);
      formData.append('populationId', importOptions.selectedPopulationId);
      formData.append('populationName', importOptions.selectedPopulationName);
      formData.append('totalUsers', importOptions.totalUsers);

      // Debug logging for backend request
      console.log('🔍 [Backend Request Debug] Population info being sent:', {
        populationId: importOptions.selectedPopulationId,
        populationName: importOptions.selectedPopulationName,
        totalUsers: importOptions.totalUsers
      });

      // Send CSV data and population info to backend for processing
      // The server will start the import process and return a session ID
      console.log('📤 [IMPORT] Sending request to backend...');

      // Enhanced fetch configuration to handle protocol issues
      const fetchOptions = {
        method: 'POST',
        body: formData,
        signal: this.importAbortController.signal,
        // Force HTTP/1.1 to avoid protocol mismatch issues
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      };
      console.log('🔧 [IMPORT] Fetch options:', {
        method: fetchOptions.method,
        hasSignal: !!fetchOptions.signal,
        headers: fetchOptions.headers
      });
      let response;
      let fetchAttempt = 1;
      const maxAttempts = 3;
      while (fetchAttempt <= maxAttempts) {
        try {
          console.log(`📤 [IMPORT] Attempt ${fetchAttempt}/${maxAttempts} - Sending request to backend...`);
          response = await fetch('/api/import', fetchOptions);
          break; // Success, exit the loop
        } catch (fetchError) {
          console.error(`❌ [IMPORT] Attempt ${fetchAttempt} failed:`, fetchError);
          if (fetchAttempt === maxAttempts) {
            throw fetchError; // Re-throw on final attempt
          }

          // Wait before retry (exponential backoff)
          const delay = Math.pow(2, fetchAttempt - 1) * 1000;
          console.log(`⏳ [IMPORT] Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          fetchAttempt++;
        }
      }
      console.log('📥 [IMPORT] Backend response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      const result = await response.json();
      console.log('📋 [IMPORT] Backend response data:', result);
      const sessionId = result.sessionId;

      // Validate session ID is present (required for SSE connection)
      if (!sessionId) {
        console.error('❌ [IMPORT] Session ID is missing from backend response');
        this.uiManager.debugLog("Import", "Session ID is undefined. Import cannot proceed.");
        this.uiManager.showError('Import failed', 'Session ID is undefined. Import cannot proceed.');
        this.isImporting = false;
        return;
      }
      console.log('✅ [IMPORT] Session ID received:', sessionId);

      // Update progress manager with session ID
      this.uiManager.updateImportOperationWithSessionId(sessionId);

      // Log session ID and establish robust SSE connection for progress updates
      this.uiManager.debugLog("Import", "Session ID received", {
        sessionId
      });
      console.log('🔌 [IMPORT] Establishing robust SSE connection with sessionId:', sessionId);
      // After receiving sessionId and before calling connectRealTimeProgress
      if (typeof _socket.io === 'undefined') {
        this.uiManager?.showError?.('Real-time updates unavailable', 'The Socket.IO client failed to load. Please refresh or contact support.');
        console.error('Socket.IO client is not defined. Real-time updates will not be used.');
        // Fallback to polling
        const sseUrl = `/api/import/progress/${sessionId}`;
        this.fallbackPolling = startFallbackPolling(sseUrl, progressData => {
          this.handleProgressUpdate(progressData);
        });
        return;
      }
      connectRealTimeProgress(sessionId);
    } catch (error) {
      console.error('❌ [IMPORT] Error during import process:', error);
      this.uiManager.debugLog("Import", "Error starting import", error);

      // Enhanced error handling for network protocol issues
      let errorMessage = error.message || 'Unknown error occurred';
      let errorTitle = 'Import failed';

      // Check for specific network protocol errors
      if (error.message && error.message.includes('ERR_H2_OR_QUIC_REQUIRED')) {
        errorTitle = 'Network Protocol Error';
        errorMessage = 'The server requires HTTP/2 or QUIC protocol, but your browser is using HTTP/1.1. This is likely a server configuration issue. Please contact your system administrator.';
      } else if (error.message && error.message.includes('Failed to fetch')) {
        errorTitle = 'Network Connection Error';
        errorMessage = 'Unable to connect to the import service. Please check your network connection and try again. If the problem persists, contact your system administrator.';
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorTitle = 'Network Error';
        errorMessage = 'Network request failed. Please check your internet connection and try again.';
      } else if (error.name === 'AbortError') {
        errorTitle = 'Import Cancelled';
        errorMessage = 'The import operation was cancelled by the user.';
      }

      // Log detailed error information for debugging
      console.error('🔍 [IMPORT] Detailed error info:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        type: error.constructor.name
      });
      this.uiManager.showError(errorTitle, errorMessage);
      this.isImporting = false;
    }
  }

  /**
   * Continue import with user's duplicate handling choice
   * 
   * @param {string} mode - Duplicate handling mode ('skip' or 'add')
   * @param {Array} duplicates - Array of duplicate users
   */
  continueImportWithDuplicateMode(mode, duplicates) {
    try {
      console.log('🔄 [IMPORT] Continuing import with duplicate mode:', mode);
      this.uiManager.debugLog("Import", `Continuing import with duplicate mode: ${mode}`);

      // Send the user's choice to the server
      fetch('/api/import/duplicates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mode: mode,
          duplicates: duplicates
        })
      }).then(response => {
        if (response.ok) {
          console.log('✅ [IMPORT] Duplicate handling choice sent successfully');
          this.uiManager.showInfo(`Continuing import with ${mode} mode for duplicates`);
        } else {
          console.error('❌ [IMPORT] Failed to send duplicate handling choice');
          this.uiManager.showError('Duplicate Handling Error', 'Failed to process duplicate handling choice');
        }
      }).catch(error => {
        console.error('❌ [IMPORT] Error sending duplicate handling choice:', error);
        this.uiManager.showError('Duplicate Handling Error', error.message || 'Unknown error');
      });
    } catch (error) {
      console.error('❌ [IMPORT] Error in continueImportWithDuplicateMode:', error);
      this.uiManager.showError('Duplicate Handling Error', error.message || 'Unknown error');
    }
  }

  /**
   * Validates and retrieves import configuration options
   * 
   * Checks that a population is selected and a CSV file is loaded.
   * Returns the configuration needed to start the import process.
   * Shows appropriate error messages if validation fails.
   * 
   * @returns {Object|null} Import options or null if validation fails
   */
  getImportOptions() {
    const selectedPopulationId = document.getElementById('import-population-select')?.value;
    const selectedPopulationName = document.getElementById('import-population-select')?.selectedOptions[0]?.text || '';
    const skipDuplicatesByEmail = document.getElementById('skip-duplicates')?.checked || false;
    const skipDuplicatesByUsername = document.getElementById('skip-duplicates-username')?.checked || false;
    const sendWelcomeEmail = document.getElementById('send-welcome-email')?.checked || false;
    if (!selectedPopulationId) {
      this.uiManager.showError('No population selected', 'Please select a population before starting the import.');
      return null;
    }

    // Validate CSV file contains users to import
    const totalUsers = this.fileHandler.getTotalUsers();
    if (!totalUsers || totalUsers === 0) {
      this.uiManager.showError('No users to import', 'Please select a CSV file with users to import.');
      return null;
    }

    // Return validated import configuration
    return {
      selectedPopulationId,
      selectedPopulationName,
      totalUsers,
      file: this.fileHandler.getCurrentFile(),
      skipDuplicatesByEmail,
      skipDuplicatesByUsername,
      sendWelcomeEmail
    };
  }

  // Enhanced method to get current population selection with validation
  getCurrentPopulationSelection() {
    const populationSelect = document.getElementById('import-population-select');
    if (!populationSelect) {
      console.error('Population select element not found');
      return null;
    }

    // Check both dropdown value and stored properties
    const dropdownValue = populationSelect.value;
    const dropdownText = populationSelect.selectedOptions[0]?.text || '';
    const storedPopulationId = this.selectedPopulationId || '';
    const storedPopulationName = this.selectedPopulationName || '';

    // Use stored values if available, otherwise use dropdown values
    const selectedPopulationId = storedPopulationId || dropdownValue;
    const selectedPopulationName = storedPopulationName || dropdownText;
    console.log('=== getCurrentPopulationSelection ===');
    console.log('Dropdown ID:', dropdownValue);
    console.log('Dropdown Name:', dropdownText);
    console.log('Stored ID:', storedPopulationId);
    console.log('Stored Name:', storedPopulationName);
    console.log('Final ID:', selectedPopulationId);
    console.log('Final Name:', selectedPopulationName);
    console.log('Select element exists:', !!populationSelect);
    console.log('====================================');
    if (!selectedPopulationId || selectedPopulationId === '') {
      return null;
    }
    return {
      id: selectedPopulationId,
      name: selectedPopulationName
    };
  }

  // Force refresh population selection to ensure it's current
  forceRefreshPopulationSelection() {
    const populationSelect = document.getElementById('import-population-select');
    if (!populationSelect) {
      console.error('Population select element not found for refresh');
      return null;
    }

    // Force a re-read of the current selection
    const currentValue = populationSelect.value;
    const currentText = populationSelect.selectedOptions[0]?.text || '';
    console.log('=== forceRefreshPopulationSelection ===');
    console.log('Forced refresh - Population ID:', currentValue);
    console.log('Forced refresh - Population Name:', currentText);
    console.log('==========================================');
    return {
      id: currentValue,
      name: currentText
    };
  }
  cancelImport() {
    // Abort the import request
    if (this.importAbortController) {
      this.importAbortController.abort();
    }

    // Clean up robust SSE connection if it exists
    if (this.robustSSE) {
      console.log("Import: 🧹 Cleaning up robust SSE connection on cancel");
      this.uiManager.debugLog("Import", "🧹 Cleaning up robust SSE connection on cancel");
      this.robustSSE.close();
      this.robustSSE = null;
    }

    // Stop fallback polling if it's active
    if (this.fallbackPolling) {
      console.log("Import: 🧹 Stopping fallback polling on cancel");
      this.uiManager.debugLog("Import", "🧹 Stopping fallback polling on cancel");
      stopFallbackPolling();
      this.fallbackPolling = null;
    }

    // Update status indicator
    updateSSEStatusIndicator('disconnected', false);

    // Reset import state
    this.isImporting = false;

    // Log cancellation
    this.uiManager.showInfo('Import cancelled by user');
    console.log("Import: 🚫 Import cancelled by user");
  }

  /**
   * Starts the user export flow by validating options, sending request to the server, and handling progress
   */
  async startExport() {
    // Check for valid token before proceeding
    const hasValidToken = await this.checkTokenAndRedirect('export');
    if (!hasValidToken) {
      console.log('❌ [EXPORT] Export cancelled due to missing valid token');
      return;
    }
    if (this.isExporting) {
      this.logger.warn('Export already in progress');
      return;
    }
    try {
      this.isExporting = true;
      this.exportAbortController = new AbortController();
      const exportOptions = this.getExportOptions();
      // If no export options, show error and stop
      if (!exportOptions) {
        this.isExporting = false;
        return;
      }
      // Show export status in UI
      this.uiManager.showExportStatus();
      // Send export request to backend
      const response = await this.localClient.post('/api/export-users', exportOptions, {
        signal: this.exportAbortController.signal,
        onProgress: (current, total, message, counts) => {
          // Update UI with export progress
          this.uiManager.updateExportProgress(current, total, message, counts);
        }
      });
      // Handle completion
      if (response.success) {
        this.uiManager.updateExportProgress(exportOptions.totalUsers, exportOptions.totalUsers, 'Export completed successfully', response.counts);
        this.uiManager.showSuccess('Export completed successfully', response.message);
      } else {
        this.uiManager.updateExportProgress(0, exportOptions.totalUsers, 'Export failed', response.counts);
        this.uiManager.showError('Export failed', response.error);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        this.uiManager.updateExportProgress(0, 0, 'Export cancelled');
        this.uiManager.showInfo('Export cancelled');
      } else {
        this.uiManager.updateExportProgress(0, 0, 'Export failed: ' + error.message);
        this.uiManager.showError('Export failed', error.message);
      }
    } finally {
      this.isExporting = false;
      this.exportAbortController = null;
    }
  }
  getExportOptions() {
    const selectedPopulationId = document.getElementById('export-population-select')?.value;
    const selectedPopulationName = document.getElementById('export-population-select')?.selectedOptions[0]?.text || '';
    const populationFilter = document.getElementById('export-population-filter')?.value || 'all';
    if (!selectedPopulationId) {
      this.uiManager.showError('No population selected', 'Please select a population before starting the export.');
      return null;
    }
    const exportOptions = {
      populationId: selectedPopulationId,
      // Send the correct field name backend expects
      selectedPopulationName,
      populationFilter,
      fields: document.getElementById('export-fields-select')?.value || 'all',
      format: document.getElementById('export-format-select')?.value || 'csv',
      ignoreDisabledUsers: document.getElementById('export-ignore-disabled')?.checked || false
    };

    // Log the export options for debugging
    console.log('Export options prepared:', exportOptions);
    return exportOptions;
  }
  cancelExport() {
    if (this.exportAbortController) {
      this.exportAbortController.abort();
    }
  }

  /**
   * Starts the user delete flow by validating options, sending request to the server, and handling progress
   */
  async startDelete() {
    // Check for valid token before proceeding
    const hasValidToken = await this.checkTokenAndRedirect('delete');
    if (!hasValidToken) {
      console.log('❌ [DELETE] Delete cancelled due to missing valid token');
      return;
    }
    if (this.isDeleting) {
      this.logger.warn('Delete already in progress');
      return;
    }
    try {
      this.isDeleting = true;
      this.deleteAbortController = new AbortController();
      const deleteOptions = this.getDeleteOptions();
      // If no delete options, show error and stop
      if (!deleteOptions) {
        this.isDeleting = false;
        return;
      }
      // Show delete status in UI
      this.uiManager.showDeleteStatus(deleteOptions.totalUsers, deleteOptions.populationName, deleteOptions.populationId);
      // Send delete request to backend
      const response = await this.localClient.post('/api/delete-users', deleteOptions, {
        signal: this.deleteAbortController.signal,
        onProgress: (current, total, message, counts) => {
          // Update UI with delete progress
          this.uiManager.updateDeleteProgress(current, total, message, counts, deleteOptions.populationName, deleteOptions.populationId);
        }
      });
      // Handle completion
      if (response.success) {
        this.uiManager.updateDeleteProgress(deleteOptions.totalUsers, deleteOptions.totalUsers, 'Delete completed successfully', response.counts, deleteOptions.populationName, deleteOptions.populationId);
        this.uiManager.showSuccess('Delete completed successfully', response.message);
      } else {
        this.uiManager.updateDeleteProgress(0, deleteOptions.totalUsers, 'Delete failed', response.counts, deleteOptions.populationName, deleteOptions.populationId);
        this.uiManager.showError('Delete failed', response.error);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        this.uiManager.updateDeleteProgress(0, 0, 'Delete cancelled');
        this.uiManager.showInfo('Delete cancelled');
      } else {
        this.uiManager.updateDeleteProgress(0, 0, 'Delete failed: ' + error.message);
        this.uiManager.showError('Delete failed', error.message);
      }
    } finally {
      this.isDeleting = false;
      this.deleteAbortController = null;
    }
  }
  getDeleteOptions() {
    const selectedPopulationId = document.getElementById('delete-population-select')?.value;
    const selectedPopulationName = document.getElementById('delete-population-select')?.selectedOptions[0]?.text || '';
    if (!selectedPopulationId) {
      this.uiManager.showError('No population selected', 'Please select a population before starting the delete.');
      return null;
    }
    const totalUsers = this.fileHandler.getTotalUsers();
    if (!totalUsers || totalUsers === 0) {
      this.uiManager.showError('No users to delete', 'Please select a CSV file with users to delete.');
      return null;
    }
    return {
      selectedPopulationId,
      selectedPopulationName,
      totalUsers,
      file: this.fileHandler.getCurrentFile()
    };
  }
  cancelDelete() {
    if (this.deleteAbortController) {
      this.deleteAbortController.abort();
    }
  }

  /**
   * Starts the user modify flow by validating options, sending request to the server, and handling progress
   */
  async startModify() {
    // Check for valid token before proceeding
    const hasValidToken = await this.checkTokenAndRedirect('modify');
    if (!hasValidToken) {
      console.log('❌ [MODIFY] Modify cancelled due to missing valid token');
      return;
    }
    if (this.isModifying) {
      this.logger.warn('Modify already in progress');
      return;
    }
    try {
      this.isModifying = true;
      this.modifyAbortController = new AbortController();
      const modifyOptions = this.getModifyOptions();
      // If no modify options, show error and stop
      if (!modifyOptions) {
        this.isModifying = false;
        return;
      }
      // Show modify status in UI
      this.uiManager.showModifyStatus(modifyOptions.totalUsers);
      // Send modify request to backend
      const response = await this.localClient.post('/api/modify-users', modifyOptions, {
        signal: this.modifyAbortController.signal,
        onProgress: (current, total, message, counts) => {
          // Update UI with modify progress
          this.uiManager.updateModifyProgress(current, total, message, counts);
        }
      });
      // Handle completion
      if (response.success) {
        this.uiManager.updateModifyProgress(modifyOptions.totalUsers, modifyOptions.totalUsers, 'Modify completed successfully', response.counts);
        this.uiManager.showSuccess('Modify completed successfully', response.message);
      } else {
        this.uiManager.updateModifyProgress(0, modifyOptions.totalUsers, 'Modify failed', response.counts);
        this.uiManager.showError('Modify failed', response.error);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        this.uiManager.updateModifyProgress(0, 0, 'Modify cancelled');
        this.uiManager.showInfo('Modify cancelled');
      } else {
        this.uiManager.updateModifyProgress(0, 0, 'Modify failed: ' + error.message);
        this.uiManager.showError('Modify failed', error.message);
      }
    } finally {
      this.isModifying = false;
      this.modifyAbortController = null;
    }
  }
  getModifyOptions() {
    const selectedPopulationId = document.getElementById('modify-population-select')?.value;
    const selectedPopulationName = document.getElementById('modify-population-select')?.selectedOptions[0]?.text || '';
    if (!selectedPopulationId) {
      this.uiManager.showError('No population selected', 'Please select a population before starting the modify.');
      return null;
    }
    const totalUsers = this.fileHandler.getTotalUsers();
    if (!totalUsers || totalUsers === 0) {
      this.uiManager.showError('No users to modify', 'Please select a CSV file with users to modify.');
      return null;
    }
    return {
      selectedPopulationId,
      selectedPopulationName,
      totalUsers,
      file: this.fileHandler.getCurrentFile()
    };
  }
  cancelModify() {
    if (this.modifyAbortController) {
      this.modifyAbortController.abort();
    }
  }
  async startPopulationDelete() {
    // Check for valid token before proceeding
    const hasValidToken = await this.checkTokenAndRedirect('population delete');
    if (!hasValidToken) {
      console.log('❌ [POPULATION DELETE] Population delete cancelled due to missing valid token');
      return;
    }
    try {
      const selectedPopulationId = document.getElementById('population-delete-select')?.value;
      const selectedPopulationName = document.getElementById('population-delete-select')?.selectedOptions[0]?.text || '';
      if (!selectedPopulationId) {
        this.uiManager.showError('No population selected', 'Please select a population to delete.');
        return;
      }

      // Show population delete status
      this.uiManager.showPopulationDeleteStatus(selectedPopulationName);

      // Start population delete process
      const response = await this.localClient.post('/api/population-delete', {
        populationId: selectedPopulationId,
        populationName: selectedPopulationName
      });

      // Handle completion
      if (response.success) {
        this.uiManager.updatePopulationDeleteProgress(1, 1, 'Population delete completed successfully');
        this.uiManager.showSuccess('Population delete completed successfully', response.message);
      } else {
        this.uiManager.updatePopulationDeleteProgress(0, 1, 'Population delete failed');
        this.uiManager.showError('Population delete failed', response.error);
      }
    } catch (error) {
      this.uiManager.updatePopulationDeleteProgress(0, 1, 'Population delete failed: ' + error.message);
      this.uiManager.showError('Population delete failed', error.message);
    }
  }
  cancelPopulationDelete() {
    this.uiManager.updatePopulationDeleteProgress(0, 0, 'Population delete cancelled');
    this.uiManager.showInfo('Population delete cancelled');
  }
  async testConnection() {
    // Check for valid token before proceeding
    const hasValidToken = await this.checkTokenAndRedirect('connection test');
    if (!hasValidToken) {
      console.log('❌ [CONNECTION TEST] Connection test cancelled due to missing valid token');
      return;
    }
    try {
      // Set button loading state
      this.uiManager.setButtonLoading('test-connection-btn', true);
      this.uiManager.showSettingsActionStatus('Testing connection...', 'info');
      const response = await this.localClient.post('/api/pingone/test-connection');
      if (response.success) {
        this.uiManager.showSettingsActionStatus('Connection test successful', 'success', {
          autoHideDelay: 3000
        });
        this.uiManager.showSuccess('Connection test successful', response.message);
      } else {
        this.uiManager.showSettingsActionStatus('Connection test failed: ' + response.error, 'error', {
          autoHide: false
        });
        this.uiManager.showError('Connection test failed', response.error);
      }
    } catch (error) {
      this.uiManager.showSettingsActionStatus('Connection test failed: ' + error.message, 'error', {
        autoHide: false
      });
      this.uiManager.showError('Connection test failed', error.message);
    } finally {
      // Always reset button loading state
      this.uiManager.setButtonLoading('test-connection-btn', false);
    }
  }

  /**
   * Format duration in seconds to a human-readable string
   * @param {number} seconds - Duration in seconds
   * @returns {string} Formatted duration string
   */
  formatDuration(seconds) {
    if (!seconds || seconds <= 0) {
      return '0s';
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor(seconds % 3600 / 60);
    const secs = seconds % 60;
    let result = '';
    if (hours > 0) {
      result += `${hours}h `;
    }
    if (minutes > 0 || hours > 0) {
      result += `${minutes}m `;
    }
    result += `${secs}s`;
    return result.trim();
  }

  /**
   * Get time remaining until expiration from JWT token
   * @param {string} token - JWT token
   * @returns {number|null} Time remaining in seconds, or null if invalid
   */
  getTimeRemainingFromJWT(token) {
    try {
      // Simple JWT decode (just the payload part)
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }
      const payload = JSON.parse(atob(parts[1]));
      if (!payload.exp) {
        return null;
      }
      const now = Math.floor(Date.now() / 1000);
      const timeRemaining = payload.exp - now;
      return timeRemaining > 0 ? timeRemaining : 0;
    } catch (error) {
      console.error('Error decoding JWT token:', error);
      return null;
    }
  }
  async getToken() {
    try {
      console.log('Get Token button clicked - starting token retrieval...');

      // Set button loading state
      this.uiManager.setButtonLoading('get-token-quick', true);
      this.uiManager.updateConnectionStatus('connecting', 'Getting token...');
      console.log('Using PingOneClient to get token (with localStorage storage)...');

      // Use PingOneClient which handles localStorage storage
      if (!this.pingOneClient) {
        this.uiManager.showError('Authentication Error', 'Authentication system not initialized. Please refresh the page and try again.');
        return;
      }
      const token = await this.pingOneClient.getAccessToken();
      console.log('Token retrieved successfully via PingOneClient');

      // Verify localStorage storage
      if (typeof localStorage !== 'undefined') {
        const storedToken = localStorage.getItem('pingone_worker_token');
        const storedExpiry = localStorage.getItem('pingone_token_expiry');
        console.log('localStorage verification:', {
          hasStoredToken: !!storedToken,
          hasStoredExpiry: !!storedExpiry,
          tokenLength: storedToken ? storedToken.length : 0,
          expiryTime: storedExpiry ? new Date(parseInt(storedExpiry)).toISOString() : null
        });
      }
      if (token) {
        // Calculate time remaining
        let timeLeft = '';
        const storedExpiry = localStorage.getItem('pingone_token_expiry');
        if (storedExpiry) {
          const expiryTime = parseInt(storedExpiry, 10);
          const now = Date.now();
          const timeRemainingSeconds = Math.max(0, Math.floor((expiryTime - now) / 1000));
          timeLeft = this.formatDuration(timeRemainingSeconds);
        } else {
          // Fallback: try to decode JWT if no expiry stored
          const timeRemainingSeconds = this.getTimeRemainingFromJWT(token);
          if (timeRemainingSeconds !== null) {
            timeLeft = this.formatDuration(timeRemainingSeconds);
          }
        }

        // Show success message with time remaining
        const successMessage = timeLeft ? `✅ New token acquired. Time left on token: ${timeLeft}` : '✅ New token acquired successfully';
        this.uiManager.updateConnectionStatus('connected', successMessage);
        this.uiManager.showSuccess('Token retrieved and stored successfully', timeLeft ? `Token has been saved to your browser. Time left: ${timeLeft}` : 'Token has been saved to your browser for future use.');
        this.uiManager.updateHomeTokenStatus(false);

        // Refresh token status display on settings page
        if (this.pingOneClient) {
          const tokenInfo = this.pingOneClient.getCurrentTokenTimeRemaining();
          this.uiManager.showCurrentTokenStatus(tokenInfo);
        }

        // Update universal token status across all pages
        this.updateUniversalTokenStatus();

        // Log success message if DEBUG_MODE is enabled
        if (window.DEBUG_MODE) {
          console.log('Token acquisition successful:', {
            tokenLength: token.length,
            timeLeft: timeLeft,
            successMessage: successMessage
          });
        }
      } else {
        this.uiManager.updateConnectionStatus('error', 'Failed to get token');
        this.uiManager.showError('Failed to get token', 'No token received from server');
      }
    } catch (error) {
      console.error('Error in getToken:', error);
      this.uiManager.updateConnectionStatus('error', 'Failed to get token: ' + error.message);
      this.uiManager.showError('Failed to get token', error.message);
    } finally {
      // Always reset button loading state
      console.log('Resetting Get Token button loading state...');
      this.uiManager.setButtonLoading('get-token-quick', false);
    }
  }

  /**
   * Check if a valid token is available and redirect to settings if not
   * @param {string} operation - Name of the operation being attempted
   * @returns {boolean} - True if valid token is available, false otherwise
   */
  async checkTokenAndRedirect(operation = 'operation') {
    try {
      console.log(`🔐 [TOKEN CHECK] Checking token for ${operation}...`);

      // Check if PingOneClient is available
      if (!this.pingOneClient) {
        console.error('❌ [TOKEN CHECK] PingOneClient not initialized');
        this.uiManager.showError('Authentication Error', 'Authentication system not initialized. Please refresh the page and try again.');
        return false;
      }

      // Get current token status
      const tokenInfo = this.pingOneClient.getCurrentTokenTimeRemaining();
      console.log('🔍 [TOKEN CHECK] Token status:', {
        hasToken: !!tokenInfo.token,
        isExpired: tokenInfo.isExpired,
        timeRemaining: tokenInfo.timeRemaining
      });

      // Check if token is valid and not expired
      if (!tokenInfo.token || tokenInfo.isExpired) {
        console.warn('❌ [TOKEN CHECK] No valid token found for operation:', operation);

        // Show enhanced token alert modal with action button
        (0, _tokenAlertModal.showTokenAlertModal)({
          tokenStatus: tokenInfo.token ? 'Expired' : 'Not Available',
          expiry: tokenInfo.expiry ? new Date(tokenInfo.expiry).toLocaleString() : '',
          operation: operation
        });
        return false;
      }
      console.log('✅ [TOKEN CHECK] Valid token found for operation:', operation);
      return true;
    } catch (error) {
      console.error('❌ [TOKEN CHECK] Error checking token:', error);
      this.uiManager.showError('Authentication Error', 'Unable to verify authentication status. Please refresh the page and try again.');
      return false;
    }
  }
  async toggleFeatureFlag(flag, enabled) {
    try {
      const response = await this.localClient.post(`/api/feature-flags/${flag}`, {
        enabled
      });
      if (response.success) {
        this.uiManager.showSuccess(`Feature flag ${flag} ${enabled ? 'enabled' : 'disabled'}`);

        // If progress page was disabled and user is currently on it, redirect to home
        if (flag === 'progressPage' && !enabled && this.currentView === 'progress') {
          this.uiManager.showWarning('Progress page has been disabled. Redirecting to home page.');
          this.showView('home');
        }
      } else {
        this.uiManager.showError(`Failed to toggle feature flag ${flag}`, response.error);
      }
    } catch (error) {
      this.uiManager.showError(`Failed to toggle feature flag ${flag}`, error.message);
    }
  }
  async resetFeatureFlags() {
    try {
      const response = await this.localClient.post('/api/feature-flags/reset', {});
      if (response.success) {
        // Reset all checkboxes to default values
        const checkboxes = document.querySelectorAll('[data-feature-flag]');
        checkboxes.forEach(checkbox => {
          const flag = checkbox.getAttribute('data-feature-flag');
          checkbox.checked = false; // Default to false
        });
        console.log('All feature flags reset to defaults');
      } else {
        console.error('Failed to reset feature flags');
      }
    } catch (error) {
      console.error('Error resetting feature flags:', error);
    }
  }
  async addNewFeatureFlag() {
    try {
      const flagName = document.getElementById('new-flag-name').value.trim();
      const description = document.getElementById('new-flag-description').value.trim();
      const enabled = document.getElementById('new-flag-enabled').checked;
      if (!flagName) {
        this.showFeatureFlagsStatus('Please enter a flag name', 'warning');
        return;
      }
      if (!description) {
        this.showFeatureFlagsStatus('Please enter a description', 'warning');
        return;
      }

      // Create new flag item in the UI
      const flagsContainer = document.querySelector('.feature-flags-content');
      const newFlagItem = document.createElement('div');
      newFlagItem.className = 'feature-flag-item';
      newFlagItem.innerHTML = `
                <label class="feature-flag-label">
                    <input type="checkbox" id="flag${flagName}" class="feature-flag-checkbox" data-feature-flag="${flagName}" ${enabled ? 'checked' : ''}>
                    <span class="feature-flag-text">Feature Flag ${flagName}</span>
                </label>
                <span class="feature-flag-description">${description}</span>
            `;

      // Insert before the add section
      const addSection = document.querySelector('.feature-flag-add-section');
      flagsContainer.insertBefore(newFlagItem, addSection);

      // Add event listener to the new checkbox
      const newCheckbox = newFlagItem.querySelector(`#flag${flagName}`);
      newCheckbox.addEventListener('change', async e => {
        const flag = e.target.getAttribute('data-feature-flag');
        const enabled = e.target.checked;
        await this.toggleFeatureFlag(flag, enabled);
      });

      // Clear the form
      document.getElementById('new-flag-name').value = '';
      document.getElementById('new-flag-description').value = '';
      document.getElementById('new-flag-enabled').checked = false;
      this.showFeatureFlagsStatus(`Feature flag "${flagName}" added successfully`, 'success');
    } catch (error) {
      console.error('Error adding new feature flag:', error);
      this.showFeatureFlagsStatus('Failed to add feature flag', 'error');
    }
  }
  showFeatureFlagsStatus(message, type = 'info') {
    const statusElement = document.getElementById('feature-flags-status');
    if (statusElement) {
      statusElement.textContent = message;
      statusElement.className = `feature-flags-status ${type}`;

      // Auto-hide after 3 seconds
      setTimeout(() => {
        statusElement.style.display = 'none';
      }, 3000);
    }
  }
  refreshProgressPage() {
    // No-op: No refreshProgressData method exists; navigation should not throw errors.
    // If needed, call a real method here (e.g., this.uiManager.startExportOperation()), but only if required.
  }

  // Test function to verify population selection
  testPopulationSelection() {
    console.log('=== Testing Population Selection ===');
    const populationSelect = document.getElementById('import-population-select');
    console.log('Population select element:', populationSelect);
    console.log('Current value:', populationSelect?.value);
    console.log('Selected option text:', populationSelect?.selectedOptions[0]?.text);
    console.log('All options:', populationSelect ? Array.from(populationSelect.options).map(opt => ({
      value: opt.value,
      text: opt.text
    })) : 'No select element');

    // Test getImportOptions
    const options = this.getImportOptions();
    console.log('getImportOptions result:', options);

    // Test getCurrentPopulationSelection
    const currentSelection = this.getCurrentPopulationSelection();
    console.log('getCurrentPopulationSelection result:', currentSelection);

    // Test forceRefreshPopulationSelection
    const forceRefresh = this.forceRefreshPopulationSelection();
    console.log('forceRefreshPopulationSelection result:', forceRefresh);

    // Validate consistency
    if (options && currentSelection && forceRefresh) {
      const isConsistent = options.selectedPopulationId === currentSelection.id && currentSelection.id === forceRefresh.id;
      console.log('Population selection consistency:', isConsistent);
      if (!isConsistent) {
        console.warn('Population selection inconsistency detected!');
      }
    }
    console.log('===============================');
    return {
      options,
      currentSelection,
      forceRefresh
    };
  }

  // Simplifies UX for disclaimer acknowledgment while still ensuring legal consent
  setupDisclaimerAgreement() {
    // New disclaimer modal system - check if disclaimer was previously accepted
    console.log('[Disclaimer] Setting up disclaimer agreement system');
    try {
      // Check if disclaimer was previously accepted
      if (window.DisclaimerModal && window.DisclaimerModal.isDisclaimerAccepted()) {
        console.log('[Disclaimer] Disclaimer previously accepted, enabling tool');
        this.enableToolAfterDisclaimer();
        this.showDisclaimerStatus();
        return;
      }

      // If disclaimer modal is available, let it handle the disclaimer flow
      if (window.DisclaimerModal) {
        console.log('[Disclaimer] Using new disclaimer modal system');
        // The modal will handle the disclaimer flow automatically
        return;
      }

      // Fallback to old disclaimer system if modal is not available
      console.warn('[Disclaimer] Disclaimer modal not available, using fallback system');
      this.setupFallbackDisclaimer();
    } catch (err) {
      console.error('[Disclaimer] Error in setupDisclaimerAgreement:', err);
    }
  }
  setupFallbackDisclaimer() {
    // Fallback disclaimer system for when modal is not available
    try {
      const disclaimerCheckbox = document.getElementById('disclaimer-agreement');
      const acceptButton = document.getElementById('accept-disclaimer');
      const disclaimerBox = document.getElementById('disclaimer');
      if (!disclaimerCheckbox || !acceptButton || !disclaimerBox) {
        console.warn('[Disclaimer] Fallback disclaimer elements not found');
        return;
      }
      console.log('[Disclaimer] Setting up fallback disclaimer system');
      const checkAgreementStatus = () => {
        const isChecked = disclaimerCheckbox.checked;
        acceptButton.disabled = !isChecked;
        if (isChecked) {
          acceptButton.classList.remove('btn-secondary');
          acceptButton.classList.add('btn-danger');
        } else {
          acceptButton.classList.remove('btn-danger');
          acceptButton.classList.add('btn-secondary');
        }
      };
      disclaimerCheckbox.addEventListener('change', e => {
        console.log('[Disclaimer] Checkbox changed:', e.target.checked);
        checkAgreementStatus();
      });
      acceptButton.addEventListener('click', e => {
        e.preventDefault();
        console.log('[Disclaimer] Accept button clicked');
        if (disclaimerCheckbox.checked) {
          console.log('[Disclaimer] ✅ Disclaimer accepted - enabling tool');
          this.enableToolAfterDisclaimer();
        } else {
          console.warn('[Disclaimer] ❌ Button clicked but checkbox not checked');
          this.uiManager.showError('Disclaimer Error', 'Please check the agreement box before proceeding.');
        }
      });
      checkAgreementStatus();
      console.log('[Disclaimer] Fallback disclaimer setup completed');
    } catch (err) {
      console.error('[Disclaimer] Error in setupFallbackDisclaimer:', err);
    }
  }

  // Check if disclaimer was previously accepted
  checkDisclaimerStatus() {
    // Use the new disclaimer modal system if available
    if (window.DisclaimerModal && window.DisclaimerModal.isDisclaimerAccepted()) {
      console.log('[Disclaimer] Disclaimer previously accepted via modal system');
      this.enableToolAfterDisclaimer();
      this.showDisclaimerStatus();
      return true;
    }

    // Fallback to localStorage check
    if (typeof localStorage !== 'undefined') {
      const disclaimerAccepted = localStorage.getItem('disclaimerAccepted');
      const disclaimerDate = localStorage.getItem('disclaimerAcceptedDate');
      console.log('[Disclaimer] Status check:', {
        accepted: disclaimerAccepted,
        date: disclaimerDate
      });
      if (disclaimerAccepted === 'true') {
        console.log('[Disclaimer] Disclaimer previously accepted, enabling tool');
        this.enableToolAfterDisclaimer();
        this.showDisclaimerStatus();
        return true;
      }
    }
    return false;
  }
  showPopulationChoicePrompt() {
    // Only show once per import session
    if (this.populationPromptShown) return;
    // Check if both file and population are selected
    const file = this.fileHandler.getCurrentFile && this.fileHandler.getCurrentFile();
    const populationSelect = document.getElementById('import-population-select');
    const populationId = populationSelect && populationSelect.value;
    if (!file || !populationId) return;
    // Check if CSV has a populationId column
    const users = this.fileHandler.getParsedUsers ? this.fileHandler.getParsedUsers() : [];
    if (!users.length) return;
    const hasPopulationColumn = Object.keys(users[0]).some(h => h.toLowerCase() === 'populationid' || h.toLowerCase() === 'population_id');
    if (!hasPopulationColumn) return; // Don't prompt if no populationId in CSV
    // Show the modal
    const modal = document.getElementById('population-warning-modal');
    if (!modal) return;
    modal.style.display = 'flex';
    this.populationPromptShown = true;
    // Set up modal buttons
    const okBtn = document.getElementById('population-warning-ok');
    const settingsBtn = document.getElementById('population-warning-settings');
    // Optionally, add override/ignore/use-csv buttons if you want more than just OK/Settings
    // For now, just close on OK
    if (okBtn) {
      okBtn.onclick = () => {
        modal.style.display = 'none';
        this.populationChoice = 'use-csv'; // Default to use CSV if present
      };
    }
    if (settingsBtn) {
      settingsBtn.onclick = () => {
        modal.style.display = 'none';
        this.populationChoice = 'settings';
        this.showView('settings');
      };
    }
  }
  showPopulationConflictModal(conflictData, sessionId) {
    console.log('Showing population conflict modal:', conflictData);

    // Create modal HTML if it doesn't exist
    let modal = document.getElementById('population-conflict-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'population-conflict-modal';
      modal.className = 'modal fade show';
      modal.style.display = 'flex';
      modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100%';
      modal.style.height = '100%';
      modal.style.zIndex = '9999';
      modal.innerHTML = `
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Population Conflict Detected</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-warning">
                                <strong>Conflict:</strong> Your CSV file contains population data AND you selected a population in the UI.
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="card">
                                        <div class="card-header">
                                            <h6>CSV Population Data</h6>
                                        </div>
                                        <div class="card-body">
                                            <p><strong>Users with population IDs:</strong> ${conflictData.csvPopulationCount}</p>
                                            <p>Users in your CSV file have their own population assignments.</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="card">
                                        <div class="card-header">
                                            <h6>UI Selected Population</h6>
                                        </div>
                                        <div class="card-body">
                                            <p><strong>Selected population:</strong> ${conflictData.uiSelectedPopulation}</p>
                                            <p>You selected this population in the dropdown.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="mt-3">
                                <p><strong>Please choose which population to use:</strong></p>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" id="use-csv-population">
                                Use CSV Population Data
                            </button>
                            <button type="button" class="btn btn-primary" id="use-ui-population">
                                Use UI Selected Population
                            </button>
                            <button type="button" class="btn btn-outline-secondary" id="cancel-conflict-resolution">
                                Cancel Import
                            </button>
                        </div>
                    </div>
                </div>
            `;
      document.body.appendChild(modal);
    } else {
      modal.style.display = 'flex';
    }

    // Set up event listeners
    const useCsvBtn = document.getElementById('use-csv-population');
    const useUiBtn = document.getElementById('use-ui-population');
    const cancelBtn = document.getElementById('cancel-conflict-resolution');
    const closeModal = () => {
      modal.style.display = 'none';
    };
    const resolveConflict = async useCsvPopulation => {
      try {
        const response = await fetch('/api/import/resolve-conflict', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sessionId,
            useCsvPopulation,
            useUiPopulation: !useCsvPopulation
          })
        });
        const result = await response.json();
        if (result.success) {
          closeModal();
          this.uiManager.showSuccess('Conflict resolved', 'Import will continue with your selection.');

          // Restart the import with the resolved conflict
          await this.startImport();
        } else {
          this.uiManager.showError('Failed to resolve conflict', result.error || 'Unknown error');
        }
      } catch (error) {
        this.uiManager.showError('Failed to resolve conflict', error.message);
      }
    };
    useCsvBtn.onclick = () => resolveConflict(true);
    useUiBtn.onclick = () => resolveConflict(false);
    cancelBtn.onclick = () => {
      closeModal();
      this.uiManager.showInfo('Import cancelled', 'Population conflict resolution was cancelled.');
    };
  }
  showInvalidPopulationModal(invalidData, sessionId) {
    console.log('Showing invalid population modal:', invalidData);
    // Get UI-selected population
    let uiPopulationName = '';
    let uiPopulationId = '';
    const populationSelect = document.getElementById('import-population-select');
    if (populationSelect) {
      uiPopulationId = populationSelect.value;
      uiPopulationName = populationSelect.selectedOptions[0]?.text || '';
    }
    // Create modal HTML if it doesn't exist
    let modal = document.getElementById('invalid-population-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'invalid-population-modal';
      modal.className = 'modal fade show';
      modal.style.display = 'flex';
      modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100%';
      modal.style.height = '100%';
      modal.style.zIndex = '9999';
      modal.innerHTML = `
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Invalid Populations Detected</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-warning">
                                <strong>Warning:</strong> Your CSV file contains population IDs that don't exist in PingOne.
                            </div>
                            <div class="ui-selected-population" style="background:#f8f9fa; border:1px solid #dee2e6; border-radius:5px; padding:8px 12px; margin-bottom:12px;">
                                <strong>UI-selected population:</strong> ${uiPopulationName ? uiPopulationName : '(none selected)'}${uiPopulationId ? ` <span style='color:#888'>(ID: ${uiPopulationId})</span>` : ''}
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="card">
                                        <div class="card-header">
                                            <h6>Invalid Populations</h6>
                                        </div>
                                        <div class="card-body">
                                            <p><strong>Invalid population IDs:</strong></p>
                                            <ul>
                                                ${invalidData.invalidPopulations.map(id => `<li><code>${id}</code></li>`).join('')}
                                            </ul>
                                            <p><strong>Affected users:</strong> ${invalidData.affectedUserCount}</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="card">
                                        <div class="card-header">
                                            <h6>Select Valid Population</h6>
                                        </div>
                                        <div class="card-body">
                                            <p>Please select a valid population to use for these users:</p>
                                            <select class="form-select" id="valid-population-select">
                                                <option value="">Loading populations...</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-primary" id="use-selected-population" disabled>
                                Use Selected Population
                            </button>
                            <button type="button" class="btn btn-outline-secondary" id="cancel-invalid-population-resolution">
                                Cancel Import
                            </button>
                        </div>
                    </div>
                </div>
            `;
      document.body.appendChild(modal);
    } else {
      // Update UI-selected population info if modal already exists
      const uiPopDiv = modal.querySelector('.ui-selected-population');
      if (uiPopDiv) {
        uiPopDiv.innerHTML = `<strong>UI-selected population:</strong> ${uiPopulationName ? uiPopulationName : '(none selected)'}${uiPopulationId ? ` <span style='color:#888'>(ID: ${uiPopulationId})</span>` : ''}`;
      }
      modal.style.display = 'flex';
    }
    // Use a different variable for the modal's population select
    const modalPopulationSelect = document.getElementById('valid-population-select');
    // Load available populations
    this.loadPopulationsForModal(invalidData, sessionId);

    // Set up event listeners
    const useSelectedBtn = document.getElementById('use-selected-population');
    const cancelBtn = document.getElementById('cancel-invalid-population-resolution');
    const populationSelectForModal = document.getElementById('valid-population-select');
    const closeModal = () => {
      modal.style.display = 'none';
    };
    const resolveInvalidPopulation = async selectedPopulationId => {
      try {
        const response = await fetch('/api/import/resolve-invalid-population', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sessionId,
            selectedPopulationId
          })
        });
        const result = await response.json();
        if (result.success) {
          closeModal();
          this.uiManager.showSuccess('Invalid population resolved', 'Import will continue with the selected population.');

          // Restart the import with the resolved invalid population
          await this.startImport();
        } else {
          this.uiManager.showError('Failed to resolve invalid population', result.error || 'Unknown error');
        }
      } catch (error) {
        this.uiManager.showError('Failed to resolve invalid population', error.message);
      }
    };
    useSelectedBtn.onclick = () => {
      const selectedPopulationId = populationSelectForModal.value;
      if (selectedPopulationId) {
        // Apply selected population to all affected users (fallback to all if indexes missing)
        const users = this.fileHandler.getParsedUsers ? this.fileHandler.getParsedUsers() : [];
        let indexes = [];
        if (invalidData && Array.isArray(invalidData.affectedUserIndexes) && invalidData.affectedUserIndexes.length > 0) {
          indexes = invalidData.affectedUserIndexes;
        } else {
          indexes = users.map((_, idx) => idx);
        }
        console.log("Affected indexes:", indexes);
        console.log("Users before update:", users.slice(0, 5));
        indexes.forEach(idx => {
          if (users[idx]) users[idx].populationId = selectedPopulationId;
        });
        console.log("User resolved population conflict with:", selectedPopulationId);
        this.uiManager.showInfo(`User resolved population conflict with: ${selectedPopulationId}`);
        closeModal();
        // Resume import
        this.startImport();
      }
    };
    cancelBtn.onclick = () => {
      closeModal();
      this.uiManager.showInfo('Import cancelled', 'Invalid population resolution was cancelled.');
    };

    // Enable/disable button based on selection
    populationSelectForModal.addEventListener('change', () => {
      useSelectedBtn.disabled = !populationSelectForModal.value;
    });
  }
  async loadPopulationsForModal(invalidData, sessionId) {
    await this.loadPopulationsForDropdown('valid-population-select');
    // The rest of the modal logic should assume the dropdown is now loaded or shows error/retry
    // Remove the old fetch logic below:
    // try {
    //     const response = await fetch('/api/pingone/populations');
    //     if (response.ok) {
    //         const populations = await response.json();
    //         const populationSelect = document.getElementById('valid-population-select');
    //         if (populationSelect) {
    //             populationSelect.innerHTML = '<option value="">Select a population...</option>';
    //             populations.forEach(population => {
    //                 const option = document.createElement('option');
    //                 option.value = population.id;
    //                 option.textContent = population.name;
    //                 populationSelect.appendChild(option);
    //             });
    //         }
    //     } else {
    //         console.error('Failed to load populations for modal');
    //     }
    // } catch (error) {
    //     console.error('Error loading populations for modal:', error);
    // }
  }

  // Error tracking methods for import operations
  trackImportError(errorMessage) {
    this.importErrors.push(errorMessage);
    this.updateImportErrorDisplay();
  }
  clearImportErrors() {
    this.importErrors = [];
    this.uiManager.hideImportErrorStatus();
  }
  updateImportErrorDisplay() {
    if (this.importErrors.length > 0) {
      const errorSummary = `Import completed with ${this.importErrors.length} error(s)`;
      this.uiManager.updateImportErrorStatus(errorSummary, this.importErrors);
    } else {
      this.uiManager.hideImportErrorStatus();
    }
  }
  resetImportErrorTracking() {
    this.importErrors = [];
    this.uiManager.hideImportErrorStatus();
  }

  // Prompt user to pick a valid population if none is selected
  async promptForPopulationSelection(affectedIndexes, users) {
    return new Promise(resolve => {
      // Build modal
      let modal = document.getElementById('pick-population-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'pick-population-modal';
        modal.className = 'modal fade show';
        modal.style.display = 'flex';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.zIndex = '9999';
        modal.innerHTML = `
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Select Population for Import</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="alert alert-warning">
                                    <strong>Warning:</strong> No valid population is selected. Please pick a population to use for all users missing or with invalid population IDs.
                                </div>
                                <div class="form-group">
                                    <label for="pick-population-select">Select Population:</label>
                                    <select class="form-select" id="pick-population-select">
                                        <option value="">Loading populations...</option>
                                    </select>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-primary" id="pick-population-confirm" disabled>Use Selected Population</button>
                                <button type="button" class="btn btn-outline-secondary" id="pick-population-cancel">Cancel Import</button>
                            </div>
                        </div>
                    </div>
                `;
        document.body.appendChild(modal);
      } else {
        modal.style.display = 'flex';
      }
      // Populate dropdown
      const populationSelect = document.getElementById('pick-population-select');
      populationSelect.innerHTML = '<option value="">Select a population...</option>';
      const importPopSelect = document.getElementById('import-population-select');
      if (importPopSelect) {
        Array.from(importPopSelect.options).forEach(opt => {
          if (opt.value) {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.text;
            populationSelect.appendChild(option);
          }
        });
      }
      // Enable confirm button only if a valid selection
      const confirmBtn = document.getElementById('pick-population-confirm');
      populationSelect.addEventListener('change', () => {
        confirmBtn.disabled = !populationSelect.value;
      });
      // Confirm handler
      confirmBtn.onclick = () => {
        const selectedId = populationSelect.value;
        if (selectedId) {
          // Set the UI dropdown to this value
          if (importPopSelect) importPopSelect.value = selectedId;
          modal.style.display = 'none';
          resolve(selectedId);
        }
      };
      // Cancel handler
      document.getElementById('pick-population-cancel').onclick = () => {
        modal.style.display = 'none';
        this.uiManager.showInfo('Import cancelled', 'No population selected.');
        resolve(null);
      };
    });
  }

  /**
   * Update universal token status across all pages
   * 
   * This method provides a centralized way to update the token status
   * display that appears on all pages. It ensures consistent token
   * status visibility and helps users understand their token state
   * without navigating to the settings page.
   * 
   * Called after token acquisition, expiration, or manual refresh
   * to keep all pages synchronized with current token state.
   */
  updateUniversalTokenStatus() {
    try {
      if (this.uiManager && this.uiManager.updateUniversalTokenStatus) {
        // Get current token info for accurate display
        let tokenInfo = null;
        if (this.pingOneClient) {
          tokenInfo = this.pingOneClient.getCurrentTokenTimeRemaining();
        }

        // Update the universal token status bar
        this.uiManager.updateUniversalTokenStatus(tokenInfo);
        if (window.DEBUG_MODE) {
          console.log('Universal token status updated:', tokenInfo);
        }
      }
    } catch (error) {
      console.error('Error updating universal token status:', error);
    }
  }

  // Enable the tool after disclaimer is accepted
  enableToolAfterDisclaimer() {
    console.log('[Disclaimer] === Enabling Tool After Disclaimer ===');
    try {
      // Hide the disclaimer section
      const disclaimerSection = document.getElementById('disclaimer');
      if (disclaimerSection) {
        disclaimerSection.style.display = 'none';
        console.log('[Disclaimer] Disclaimer section hidden');
      }

      // Enable navigation tabs
      const navItems = document.querySelectorAll('[data-view]');
      navItems.forEach(item => {
        item.style.pointerEvents = 'auto';
        item.style.opacity = '1';
      });

      // Enable feature cards
      const featureCards = document.querySelectorAll('.feature-card');
      featureCards.forEach(card => {
        card.style.pointerEvents = 'auto';
        card.style.opacity = '1';
      });

      // Show disclaimer status instead of success message
      this.showDisclaimerStatus();

      // Store disclaimer acceptance in localStorage
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('disclaimerAccepted', 'true');
        localStorage.setItem('disclaimerAcceptedDate', new Date().toISOString());
      }

      // Scroll to top of page smoothly after disclaimer acceptance
      setTimeout(() => {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth'
        });
        console.log('[Disclaimer] ✅ Scrolled to top of page smoothly');
      }, 100);
      console.log('[Disclaimer] ✅ Tool enabled successfully after disclaimer acceptance');
    } catch (error) {
      console.error('[Disclaimer] Error enabling tool after disclaimer:', error);
      this.uiManager.showError('Error', 'Failed to enable tool after disclaimer acceptance.');
    }
  }
  showDisclaimerStatus() {
    // Show the disclaimer status section
    const disclaimerStatus = document.getElementById('disclaimer-status');
    if (disclaimerStatus) {
      disclaimerStatus.style.display = 'block';
      console.log('[Disclaimer] Disclaimer status shown');
    }

    // Log the disclaimer acceptance
    if (window.logManager && typeof window.logManager.log === 'function') {
      window.logManager.log('info', 'Disclaimer accepted by user', {
        source: 'app',
        type: 'disclaimer',
        timestamp: new Date().toISOString()
      });
    } else {
      console.info('[Disclaimer] Disclaimer accepted by user', {
        source: 'app',
        type: 'disclaimer',
        timestamp: new Date().toISOString()
      });
    }
  }
  attachPopulationChangeListener() {
    console.log('🔄 Attaching population change listener...');
    const populationSelectEl = document.getElementById('import-population-select');
    if (!populationSelectEl) {
      console.error('❌ Population select element not found for event listener');
      console.error('❌ Available select elements:', document.querySelectorAll('select[id*="population"]').length);
      return;
    }
    console.log('✅ Population select element found for event listener');

    // Remove existing listener to prevent duplicates
    populationSelectEl.removeEventListener('change', this.handlePopulationChange.bind(this));
    console.log('🔄 Removed existing event listener');

    // Add the change listener
    populationSelectEl.addEventListener('change', this.handlePopulationChange.bind(this));
    console.log('✅ Population change listener attached');
  }
  handlePopulationChange(e) {
    const populationSelectEl = e.target;
    const selectedId = populationSelectEl.value;
    const selectedName = populationSelectEl.selectedOptions[0]?.text || '';
    this.selectedPopulationId = selectedId;
    this.selectedPopulationName = selectedName;
    console.log('[Population] Dropdown changed:', {
      id: selectedId,
      name: selectedName
    });

    // Update import button state when population selection changes
    this.updateImportButtonState();

    // Update population display in import stats
    const populationNameElement = document.getElementById('import-population-name');
    const populationIdElement = document.getElementById('import-population-id');
    if (populationNameElement) {
      populationNameElement.textContent = selectedName || 'Not selected';
    }
    if (populationIdElement) {
      populationIdElement.textContent = selectedId || 'Not set';
    }
  }

  // If you have a modal or function that uses pick-population-select, add:
  async loadPickPopulationModal() {
    await this.loadPopulationsForDropdown('pick-population-select');
    // The rest of the modal logic should assume the dropdown is now loaded or shows error/retry
  }

  // Example: Defensive null check for classList usage
  safeAddClass(element, className) {
    if (element && element.classList) {
      element.classList.add(className);
    }
  }
  safeRemoveClass(element, className) {
    if (element && element.classList) {
      element.classList.remove(className);
    }
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const app = new App();
    await app.init();

    // Make app globally available for debugging
    window.app = app;
  } catch (error) {
    console.error('Failed to initialize app:', error);
  }
});

// Debug log filtering functions
window.clearDebugLog = function () {
  const debugContent = document.getElementById('debug-log-content');
  if (debugContent) {
    debugContent.innerHTML = '';
  }
};
window.toggleDebugFilter = function (area) {
  // Store filter state
  if (!window.debugFilters) window.debugFilters = {};
  window.debugFilters[area] = !window.debugFilters[area];
  applyDebugFilters();
};
window.applyDebugFilters = function () {
  const debugContent = document.getElementById('debug-log-content');
  if (!debugContent) return;
  const entries = debugContent.querySelectorAll('.debug-log-entry');
  entries.forEach(entry => {
    const area = entry.getAttribute('data-area');
    const isVisible = !window.debugFilters || window.debugFilters[area] !== false;
    entry.style.display = isVisible ? 'block' : 'none';
  });
};

// Initialize debug filters
window.debugFilters = {};

// Enhanced log entry expansion functionality is now handled by log-manager.js
// This provides better accessibility, visual feedback, and reliable first-click behavior

// === DEBUG LOG PANEL TOGGLE LOGIC ===

// === DEBUG LOG PANEL TOGGLE LOGIC ===
// Handles open/close, accessibility, and scroll position for the debug log panel
(function setupDebugLogToggle() {
  const toggleBtn = document.getElementById('debug-log-toggle');
  const panel = document.getElementById('debug-log-panel');
  const logEntries = document.getElementById('log-entries');
  let lastScrollTop = 0;
  if (!toggleBtn || !panel) return; // SAFEGUARD: Only run if elements exist

  // Toggle panel open/close
  function togglePanel(forceOpen) {
    const isOpen = !panel.classList.contains('collapsed');
    if (forceOpen === true || !isOpen && forceOpen === undefined) {
      panel.classList.remove('collapsed');
      toggleBtn.setAttribute('aria-expanded', 'true');
      toggleBtn.setAttribute('aria-label', 'Hide Debug Log Console');
      // Restore scroll position
      if (lastScrollTop) logEntries.scrollTop = lastScrollTop;
      panel.focus();
    } else {
      lastScrollTop = logEntries.scrollTop;
      panel.classList.add('collapsed');
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.setAttribute('aria-label', 'Show Debug Log Console');
      toggleBtn.focus();
    }
  }

  // Click handler
  toggleBtn.addEventListener('click', () => togglePanel());
  // Keyboard accessibility (Enter/Space)
  toggleBtn.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      togglePanel();
    }
  });
  // Optionally, close with Escape when focused
  panel.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      e.preventDefault();
      togglePanel(false);
    }
  });
  // Default to collapsed
  panel.classList.add('collapsed');
  toggleBtn.setAttribute('aria-expanded', 'false');
  // Optionally, open if hash is #debug-log
  if (window.location.hash === '#debug-log') togglePanel(true);
})();

// Global stream tracker for SSE progress streams (by sessionId)
// Prevents undefined reference errors during stream connection lifecycle
if (typeof window.importProgressStreams === 'undefined') {
  window.importProgressStreams = new Map();
}
const importProgressStreams = window.importProgressStreams;

// ===============================
// SSE EventSource Wrapper
// ===============================

/**
 * Robust SSE (EventSource) wrapper with exponential backoff, connection status events, and full lifecycle logging.
 * Usage: const sse = new RobustEventSource(url, { onMessage, onOpen, onError, onStatus });
 */
class RobustEventSource {
  constructor(url, {
    onMessage,
    onOpen,
    onError,
    onStatus,
    maxRetries = 10,
    baseDelay = 1000,
    maxDelay = 30000
  } = {}) {
    this.url = url;
    this.onMessage = onMessage;
    this.onOpen = onOpen;
    this.onError = onError;
    this.onStatus = onStatus;
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
    this.maxDelay = maxDelay;
    this.retryCount = 0;
    this.eventSource = null;
    this.closed = false;
    this.connect();
  }
  connect() {
    if (this.closed) return;
    this.eventSource = new EventSource(this.url);
    this._emitStatus('connecting');
    this.eventSource.onopen = e => {
      this.retryCount = 0;
      this._emitStatus('connected');
      if (this.onOpen) this.onOpen(e);
      console.log('[SSE] Connected:', this.url);
    };
    this.eventSource.onmessage = e => {
      if (this.onMessage) this.onMessage(e);
    };
    this.eventSource.onerror = e => {
      this._emitStatus('error');
      if (this.onError) this.onError(e);
      console.error('[SSE] Error:', e);
      this.eventSource.close();
      if (!this.closed) this._scheduleReconnect();
    };
    this.eventSource.onclose = e => {
      this._emitStatus('closed');
      console.warn('[SSE] Closed:', e);
    };
  }
  _scheduleReconnect() {
    if (this.retryCount >= this.maxRetries) {
      this._emitStatus('failed');
      console.error('[SSE] Max retries reached. Giving up.');
      return;
    }
    const delay = Math.min(this.baseDelay * Math.pow(2, this.retryCount), this.maxDelay);
    this.retryCount++;
    this._emitStatus('reconnecting', delay);
    console.warn(`[SSE] Reconnecting in ${delay}ms (attempt ${this.retryCount})`);
    setTimeout(() => this.connect(), delay);
  }
  _emitStatus(status, data) {
    if (this.onStatus) this.onStatus(status, data);
  }
  close() {
    this.closed = true;
    if (this.eventSource) this.eventSource.close();
    this._emitStatus('closed');
  }
}
// ===============================

// ===============================
// SSE Status Indicator & Fallback Polling
// ===============================

// Add a status indicator to the DOM (if not present)
function ensureSSEStatusIndicator() {
  let indicator = document.getElementById('sse-status-indicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'sse-status-indicator';
    indicator.style.position = 'fixed';
    indicator.style.bottom = '80px';
    indicator.style.right = '30px';
    indicator.style.zIndex = '2000';
    indicator.style.padding = '10px 18px';
    indicator.style.borderRadius = '8px';
    indicator.style.fontWeight = 'bold';
    indicator.style.fontSize = '15px';
    indicator.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
    indicator.style.display = 'flex';
    indicator.style.alignItems = 'center';
    indicator.innerHTML = '<span class="sse-status-dot" style="width:12px;height:12px;border-radius:50%;display:inline-block;margin-right:10px;"></span><span class="sse-status-text"></span>';
    document.body.appendChild(indicator);
  }
  return indicator;
}
function updateSSEStatusIndicator(status, fallback) {
  const indicator = ensureSSEStatusIndicator();
  const dot = indicator.querySelector('.sse-status-dot');
  const text = indicator.querySelector('.sse-status-text');
  let color = '#6c757d',
    msg = 'Unknown';
  if (status === 'connected') {
    color = '#28a745';
    msg = 'Connected';
  } else if (status === 'connecting') {
    color = '#ffc107';
    msg = 'Connecting...';
  } else if (status === 'reconnecting') {
    color = '#ffc107';
    msg = 'Reconnecting...';
  } else if (status === 'error') {
    color = '#dc3545';
    msg = 'Connection Error';
  } else if (status === 'closed') {
    color = '#dc3545';
    msg = 'Disconnected';
  } else if (status === 'failed') {
    color = '#dc3545';
    msg = 'Failed';
  }
  dot.style.background = color;
  text.textContent = msg + (fallback ? ' (Fallback Mode)' : '');
  indicator.style.background = fallback ? '#fff3cd' : '#f8f9fa';
  indicator.style.color = fallback ? '#856404' : '#333';
  indicator.style.border = fallback ? '2px solid #ffc107' : '1px solid #dee2e6';
  indicator.style.boxShadow = fallback ? '0 2px 12px #ffe066' : '0 2px 8px rgba(0,0,0,0.12)';
  indicator.title = fallback ? 'Real-time updates unavailable, using fallback polling.' : 'SSE connection status';
}

// Fallback polling logic
let fallbackPollingInterval = null;
function startFallbackPolling(progressUrl, onProgress) {
  if (fallbackPollingInterval) return;
  updateSSEStatusIndicator('failed', true);
  fallbackPollingInterval = setInterval(() => {
    fetch(progressUrl).then(r => r.json()).then(data => {
      if (onProgress) onProgress({
        data: JSON.stringify(data)
      });
    }).catch(err => {
      console.error('[Fallback Polling] Error:', err);
    });
  }, 5000); // Poll every 5 seconds
  console.warn('[SSE] Fallback polling started.');
}
function stopFallbackPolling() {
  if (fallbackPollingInterval) {
    clearInterval(fallbackPollingInterval);
    fallbackPollingInterval = null;
    console.log('[SSE] Fallback polling stopped.');
  }
}

// Integrate with import progress logic
function setupImportProgressSSE(sessionId, onProgress) {
  const sseUrl = `/api/import/progress/${sessionId}`;
  let fallbackActive = false;
  let sse = new RobustEventSource(sseUrl, {
    onMessage: e => {
      if (onProgress) onProgress(e);
    },
    onOpen: () => {
      updateSSEStatusIndicator('connected', false);
      stopFallbackPolling();
      fallbackActive = false;
    },
    onError: () => {
      updateSSEStatusIndicator('error', fallbackActive);
    },
    onStatus: (status, data) => {
      updateSSEStatusIndicator(status, fallbackActive);
      if (status === 'failed') {
        fallbackActive = true;
        // Start fallback polling
        startFallbackPolling(`/api/import/progress-fallback/${sessionId}`, onProgress);
      } else if (status === 'connected') {
        fallbackActive = false;
        stopFallbackPolling();
      }
    }
  });
  return sse;
}
// ... existing code ...
// Example usage in your import logic:
// const sse = setupImportProgressSSE(sessionId, handleProgressEvent);
// When done: sse.close(); stopFallbackPolling();

// Centralized error handler for API/network/form errors
function handleAppError(error, context = {}) {
  const ui = window.app && window.app.uiManager;
  let userMessage = 'An unexpected error occurred. Please try again.';
  let errorType = 'error';

  // Handle different error types with specific user-friendly messages
  if (error && error.response) {
    // HTTP error response
    const status = error.response.status;
    if (status === 401) {
      userMessage = 'Session expired – please log in again.';
      errorType = 'warning';
    } else if (status === 403) {
      userMessage = 'Access denied. Please check your permissions.';
      errorType = 'error';
    } else if (status === 404) {
      userMessage = 'Resource not found. Please check your settings.';
      errorType = 'warning';
    } else if (status === 429) {
      userMessage = 'Too many requests. Please wait a moment and try again.';
      errorType = 'warning';
    } else if (status >= 500) {
      userMessage = 'Server error – please try again later.';
      errorType = 'error';
    } else {
      // Try to get error message from response
      error.response.json().then(data => {
        userMessage = data.error || userMessage;
        if (ui) ui.showStatusBar(userMessage, errorType, {
          autoDismiss: false
        });
      }).catch(() => {
        if (ui) ui.showStatusBar(userMessage, errorType, {
          autoDismiss: false
        });
      });
      return;
    }
  } else if (error && error.message) {
    // Network or other errors
    if (error.message.includes('Network') || error.message.includes('fetch')) {
      userMessage = 'Network error – check your connection and try again.';
      errorType = 'warning';
    } else if (error.message.includes('timeout')) {
      userMessage = 'Request timed out – please try again.';
      errorType = 'warning';
    } else if (error.message.includes('aborted')) {
      userMessage = 'Request was cancelled.';
      errorType = 'info';
      return; // Don't show for user-initiated cancellations
    } else if (error.message.includes('Failed to fetch')) {
      userMessage = 'Cannot connect to server. Please check your connection.';
      errorType = 'error';
    }
  }

  // Show error in status bar
  if (ui) {
    ui.showStatusBar(userMessage, errorType, {
      autoDismiss: errorType === 'info' || errorType === 'success',
      duration: errorType === 'info' ? 3000 : 6000
    });
  }

  // Log error for debugging
  console.error('Application error:', error, context);
}

// Enhanced safe API call wrapper with better error handling
async function safeApiCall(apiFn, ...args) {
  try {
    return await apiFn(...args);
  } catch (error) {
    // Handle AbortError separately (user cancellation)
    if (error.name === 'AbortError') {
      console.log('Request was cancelled by user');
      return;
    }

    // Handle fetch errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      handleAppError(new Error('Network error – check your connection.'), {
        context: 'API call failed',
        function: apiFn.name
      });
    } else {
      handleAppError(error, {
        context: 'API call failed',
        function: apiFn.name
      });
    }
    throw error;
  }
}

// Enhanced form validation with status bar feedback
function validateAndSubmit(form, validateFn, submitFn) {
  const ui = window.app && window.app.uiManager;

  // Validate form
  const validation = validateFn(form);
  if (!validation.valid) {
    if (ui) {
      ui.showStatusBar(validation.message, 'warning', {
        autoDismiss: true,
        duration: 4000
      });
    }
    return false;
  }

  // Show loading state
  if (ui) {
    ui.showStatusBar('Processing...', 'info', {
      autoDismiss: false
    });
  }

  // Submit with error handling
  submitFn(form).catch(error => {
    handleAppError(error, {
      context: 'Form submission failed'
    });
  });
  return true;
}

// Enhanced fallback UI for critical errors
function showFallbackUI(type) {
  const ui = window.app && window.app.uiManager;
  switch (type) {
    case '404':
      ui && ui.showStatusBar('Page not found. Please return to Home.', 'warning', {
        autoDismiss: false
      });
      break;
    case '500':
      ui && ui.showStatusBar('Server error – please try again later.', 'error', {
        autoDismiss: false
      });
      break;
    case 'maintenance':
      ui && ui.showStatusBar('Service is under maintenance. Please try again later.', 'info', {
        autoDismiss: false
      });
      break;
    case 'network':
      ui && ui.showStatusBar('Network connection lost. Please check your connection.', 'error', {
        autoDismiss: false
      });
      break;
    case 'timeout':
      ui && ui.showStatusBar('Request timed out. Please try again.', 'warning', {
        autoDismiss: true
      });
      break;
    default:
      ui && ui.showStatusBar('An unexpected error occurred.', 'error', {
        autoDismiss: false
      });
  }
}

// Enhanced input validation with status bar feedback
function validateInput(input, rules = {}) {
  const ui = window.app && window.app.uiManager;
  const value = input.value.trim();

  // Required field validation
  if (rules.required && !value) {
    const message = rules.requiredMessage || 'This field is required.';
    if (ui) ui.showStatusBar(message, 'warning', {
      autoDismiss: true
    });
    return false;
  }

  // Email validation
  if (rules.email && value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      const message = rules.emailMessage || 'Please enter a valid email address.';
      if (ui) ui.showStatusBar(message, 'warning', {
        autoDismiss: true
      });
      return false;
    }
  }

  // URL validation
  if (rules.url && value) {
    try {
      new URL(value);
    } catch {
      const message = rules.urlMessage || 'Please enter a valid URL.';
      if (ui) ui.showStatusBar(message, 'warning', {
        autoDismiss: true
      });
      return false;
    }
  }

  // Min length validation
  if (rules.minLength && value.length < rules.minLength) {
    const message = rules.minLengthMessage || `Must be at least ${rules.minLength} characters.`;
    if (ui) ui.showStatusBar(message, 'warning', {
      autoDismiss: true
    });
    return false;
  }

  // Max length validation
  if (rules.maxLength && value.length > rules.maxLength) {
    const message = rules.maxLengthMessage || `Must be no more than ${rules.maxLength} characters.`;
    if (ui) ui.showStatusBar(message, 'warning', {
      autoDismiss: true
    });
    return false;
  }

  // Custom validation
  if (rules.custom && !rules.custom(value)) {
    const message = rules.customMessage || 'Invalid input.';
    if (ui) ui.showStatusBar(message, 'warning', {
      autoDismiss: true
    });
    return false;
  }
  return true;
}

// === Import Dashboard Logic ===
function setupImportDashboard(app) {
  const dashboardTab = document.querySelector('.nav-item[data-view="import-dashboard"]');
  const dashboardView = document.getElementById('import-dashboard-view');
  const dropZone = document.getElementById('import-drop-zone');
  const fileInput = document.getElementById('dashboard-csv-file');
  const fileFeedback = document.getElementById('dashboard-file-feedback');
  const importOptions = document.getElementById('dashboard-import-options');
  const importActions = document.getElementById('dashboard-import-actions');
  if (!dashboardTab || !dashboardView || !dropZone || !fileInput) return;

  // Navigation: Show dashboard view, hide others
  dashboardTab.addEventListener('click', () => {
    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
    dashboardView.style.display = 'block';
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    dashboardTab.classList.add('active');
    // Reset dashboard state
    fileFeedback.textContent = '';
    dropZone.classList.remove('dragover');
    fileInput.value = '';
    importOptions.innerHTML = '';
    importActions.innerHTML = '';
    // Optionally, render import options here
    renderDashboardImportOptions(app, importOptions, importActions);
  });

  // Drag-and-drop events
  dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });
  dropZone.addEventListener('dragleave', e => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
  });
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleDashboardFileSelect(files[0], app, fileFeedback, importOptions, importActions);
    }
  });
  // Fallback file input
  fileInput.addEventListener('change', e => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleDashboardFileSelect(files[0], app, fileFeedback, importOptions, importActions);
    }
  });
}
function handleDashboardFileSelect(file, app, fileFeedback, importOptions, importActions) {
  if (!file || !file.name.match(/\.csv$|\.txt$/i)) {
    fileFeedback.textContent = 'Please select a valid CSV or TXT file.';
    fileFeedback.classList.add('error');
    return;
  }
  fileFeedback.classList.remove('error');
  fileFeedback.innerHTML = `<i class="fas fa-check-circle" style="color:var(--ping-success-green)"></i> ${file.name} (${file.type || 'text/csv'})`;
  // Use shared file handler logic
  app.fileHandler.handleFile(file).then(() => {
    // Render import options and actions after file is loaded
    renderDashboardImportOptions(app, importOptions, importActions);
  }).catch(err => {
    fileFeedback.textContent = 'File parsing failed: ' + (err.message || err);
    fileFeedback.classList.add('error');
  });
}
function renderDashboardImportOptions(app, importOptions, importActions) {
  // Reuse the same import options UI as the classic import view
  // For simplicity, clone or move the relevant DOM or re-render options here
  // Example: show a submit button
  importOptions.innerHTML = '';
  importActions.innerHTML = '';
  // Add import options (toggles, etc.) as needed
  // ...
  // Add submit button
  const submitBtn = document.createElement('button');
  submitBtn.className = 'btn btn-primary';
  submitBtn.innerHTML = '<i class="fas fa-upload"></i> Start Import';
  submitBtn.onclick = () => app.startImport();
  importActions.appendChild(submitBtn);
}

// Initialize dashboard after app is ready
window.addEventListener('DOMContentLoaded', () => {
  if (window.app) {
    setupImportDashboard(window.app);
  } else {
    setTimeout(() => {
      if (window.app) setupImportDashboard(window.app);
    }, 1000);
  }
});

// In the settings form logic:
// When loading settings, set the region dropdown value to the region code
function populateSettingsForm(settings) {
  // ... existing code ...
  const regionSelect = document.getElementById('region');
  if (regionSelect && settings.region) {
    regionSelect.value = settings.region;
  }
  // ... existing code ...
}

// When saving settings, get the region code from the dropdown
function getSettingsFromForm() {
  // ... existing code ...
  const regionSelect = document.getElementById('region');
  const region = regionSelect ? regionSelect.value : 'NA';
  // ... existing code ...
  return {
    // ... other settings ...
    region
    // ... other settings ...
  };
}

// Helper to get selected region info from dropdown
function getSelectedRegionInfo() {
  const regionSelect = document.getElementById('region');
  if (!regionSelect) return {
    code: 'NA',
    tld: 'com',
    label: 'North America (excluding Canada)'
  };
  const selectedOption = regionSelect.options[regionSelect.selectedIndex];
  return {
    code: selectedOption.value,
    tld: selectedOption.getAttribute('data-tld'),
    label: selectedOption.textContent
  };
}

// Ensure region dropdown is accessible
const regionSelect = document.getElementById('region');
if (regionSelect) {
  regionSelect.setAttribute('aria-label', 'Select PingOne region');
}

// ... existing code ...
// After fileHandler and UIManager are initialized and import view is set up:
function setupImportDropZone() {
  const dropZone = document.getElementById('import-drop-zone');
  const fileInput = document.getElementById('csv-file');
  if (dropZone && fileInput && window.fileHandler) {
    window.fileHandler.initializeDropZone(dropZone);
    // Make clicking the drop zone open the file picker
    dropZone.addEventListener('click', () => fileInput.click());
    // Keyboard accessibility: Enter/Space triggers file input
    dropZone.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fileInput.click();
      }
    });
  }
}

// Call this after import view is shown (or on DOMContentLoaded if always visible)
document.addEventListener('DOMContentLoaded', () => {
  setupImportDropZone();
});
// ... existing code ...

// ... existing code ...
// After fileHandler and UIManager are initialized and modify view is set up:
function setupModifyDropZone() {
  const dropZone = document.getElementById('modify-drop-zone');
  const fileInput = document.getElementById('modify-csv-file');
  if (dropZone && fileInput && window.fileHandler) {
    window.fileHandler.initializeDropZone(dropZone);
    // Make clicking the drop zone open the file picker
    dropZone.addEventListener('click', () => fileInput.click());
    // Keyboard accessibility: Enter/Space triggers file input
    dropZone.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fileInput.click();
      }
    });
  } else {
    if (!dropZone) console.warn('[Modify] Drop zone element missing');
    if (!fileInput) console.warn('[Modify] File input element missing');
    if (!window.fileHandler) console.warn('[Modify] FileHandler not initialized');
  }
}

// Call this after modify view is shown
function onModifyViewShown() {
  setupModifyDropZone();
  // Check for required token and population elements
  const tokenStatus = document.getElementById('current-token-status');
  const homeTokenStatus = document.getElementById('home-token-status');
  const getTokenBtn = document.getElementById('get-token-quick');
  if (!tokenStatus) console.warn('[Modify] #current-token-status element missing');
  if (!homeTokenStatus) console.warn('[Modify] #home-token-status element missing');
  if (!getTokenBtn) console.warn('[Modify] Get Token button missing');
  // Only run population/token logic if elements exist
  if (tokenStatus && homeTokenStatus && getTokenBtn) {
    // Place any population or token logic here
    // e.g., this.loadPopulationsForDropdown('modify-population-select');
  }
}

// Patch showView to call onModifyViewShown for modify view
const originalShowView = window.app && window.app.showView;
if (originalShowView) {
  window.app.showView = function (view) {
    originalShowView.call(this, view);
    if (view === 'modify') {
      onModifyViewShown();
    }
  };
} else {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.app && typeof window.app.showView === 'function') {
      const orig = window.app.showView;
      window.app.showView = function (view) {
        orig.call(this, view);
        if (view === 'modify') {
          onModifyViewShown();
        }
      };
    }
  });
}
// ... existing code ...

// ... existing code ...
window.enableToolAfterDisclaimer = () => {
  if (window.app && typeof window.app.enableToolAfterDisclaimer === 'function') {
    window.app.enableToolAfterDisclaimer();
  }
};
// ... existing code ...

// ... existing code ...
// Ensure all DOM and module-dependent code runs after DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.app && window.app.init) {
      window.app.init();
    }
  });
} else {
  if (window.app && window.app.init) {
    window.app.init();
  }
}

// Defensive: wrap all classList and DOM accesses in null checks throughout the file
// Defensive: check robustSSE and uiManager before calling their methods
// ... existing code ...

},{"./modules/api-factory.js":40,"./modules/delete-manager.js":43,"./modules/export-manager.js":45,"./modules/file-handler.js":46,"./modules/file-logger.js":47,"./modules/history-manager.js":48,"./modules/local-api-client.js":49,"./modules/logger.js":50,"./modules/pingone-client.js":52,"./modules/progress-manager.js":53,"./modules/settings-manager.js":55,"./modules/token-alert-modal.js":56,"./modules/token-manager.js":57,"./modules/ui-manager.js":58,"./modules/version-manager.js":59,"@babel/runtime/helpers/interopRequireDefault":1,"socket.io-client":27}],40:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.apiFactory = exports.APIFactory = void 0;
exports.createAutoRetryAPIClient = createAutoRetryAPIClient;
exports.createPingOneAPIClient = createPingOneAPIClient;
exports.initAPIFactory = exports.getAPIFactory = exports.default = void 0;
var _tokenManager = _interopRequireDefault(require("./token-manager.js"));
var _localApiClient = require("./local-api-client.js");
var _pingoneClient = require("./pingone-client.js");
/**
 * API Factory - Creates API clients with automatic token re-authentication
 * 
 * This module provides a factory for creating API clients that automatically
 * handle token expiration by detecting 401 responses and retrying with new tokens
 * using stored credentials.
 */

/**
 * Create an API client with automatic token re-authentication
 * @param {Object} settings - API settings including credentials
 * @param {Object} logger - Logger instance
 * @returns {Object} API client with auto-retry capabilities
 */
function createAutoRetryAPIClient(settings, logger) {
  const tokenManager = new _tokenManager.default(logger, settings);

  /**
   * Make an API request with automatic token re-authentication
   * @param {string} url - The API endpoint URL
   * @param {Object} options - Request options
   * @returns {Promise<Object>} The API response
   */
  async function makeRequest(url, options = {}) {
    return await tokenManager.retryWithNewToken(async token => {
      const requestOptions = {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };
      const response = await fetch(url, requestOptions);

      // Check for token expiration
      if (response.status === 401) {
        const responseText = await response.text().catch(() => '');
        const isTokenExpired = responseText.includes('token_expired') || responseText.includes('invalid_token') || responseText.includes('expired');
        if (isTokenExpired) {
          throw new Error('TOKEN_EXPIRED');
        }
      }
      return response;
    });
  }

  /**
   * GET request with auto-retry
   * @param {string} url - The API endpoint URL
   * @param {Object} options - Request options
   * @returns {Promise<Object>} The API response
   */
  async function get(url, options = {}) {
    return await makeRequest(url, {
      ...options,
      method: 'GET'
    });
  }

  /**
   * POST request with auto-retry
   * @param {string} url - The API endpoint URL
   * @param {Object} data - Request body data
   * @param {Object} options - Request options
   * @returns {Promise<Object>} The API response
   */
  async function post(url, data = null, options = {}) {
    const requestOptions = {
      ...options,
      method: 'POST'
    };
    if (data) {
      requestOptions.body = JSON.stringify(data);
    }
    return await makeRequest(url, requestOptions);
  }

  /**
   * PUT request with auto-retry
   * @param {string} url - The API endpoint URL
   * @param {Object} data - Request body data
   * @param {Object} options - Request options
   * @returns {Promise<Object>} The API response
   */
  async function put(url, data = null, options = {}) {
    const requestOptions = {
      ...options,
      method: 'PUT'
    };
    if (data) {
      requestOptions.body = JSON.stringify(data);
    }
    return await makeRequest(url, requestOptions);
  }

  /**
   * DELETE request with auto-retry
   * @param {string} url - The API endpoint URL
   * @param {Object} options - Request options
   * @returns {Promise<Object>} The API response
   */
  async function del(url, options = {}) {
    return await makeRequest(url, {
      ...options,
      method: 'DELETE'
    });
  }

  /**
   * PATCH request with auto-retry
   * @param {string} url - The API endpoint URL
   * @param {Object} data - Request body data
   * @param {Object} options - Request options
   * @returns {Promise<Object>} The API response
   */
  async function patch(url, data = null, options = {}) {
    const requestOptions = {
      ...options,
      method: 'PATCH'
    };
    if (data) {
      requestOptions.body = JSON.stringify(data);
    }
    return await makeRequest(url, requestOptions);
  }

  /**
   * Get token information
   * @returns {Object|null} Token info
   */
  function getTokenInfo() {
    return tokenManager.getTokenInfo();
  }

  /**
   * Update settings and clear token cache if credentials changed
   * @param {Object} newSettings - New settings
   */
  function updateSettings(newSettings) {
    tokenManager.updateSettings(newSettings);
  }
  return {
    get,
    post,
    put,
    del,
    patch,
    getTokenInfo,
    updateSettings,
    tokenManager
  };
}

/**
 * Create a PingOne API client with automatic token re-authentication
 * @param {Object} settings - PingOne API settings
 * @param {Object} logger - Logger instance
 * @returns {Object} PingOne API client
 */
function createPingOneAPIClient(settings, logger) {
  const baseURL = getPingOneBaseURL(settings.region);
  const apiClient = createAutoRetryAPIClient(settings, logger);

  /**
   * Get PingOne base URL for the region
   * @param {string} region - The region
   * @returns {string} Base URL
   */
  function getPingOneBaseURL(region) {
    const baseURLs = {
      'NorthAmerica': 'https://api.pingone.com',
      'Europe': 'https://api.eu.pingone.com',
      'Canada': 'https://api.ca.pingone.com',
      'Asia': 'https://api.apsoutheast.pingone.com',
      'Australia': 'https://api.aus.pingone.com',
      'US': 'https://api.pingone.com',
      'EU': 'https://api.eu.pingone.com',
      'AP': 'https://api.apsoutheast.pingone.com'
    };
    return baseURLs[region] || 'https://api.pingone.com';
  }

  /**
   * Make a PingOne API request
   * @param {string} endpoint - API endpoint (without base URL)
   * @param {Object} options - Request options
   * @returns {Promise<Object>} The API response
   */
  async function pingOneRequest(endpoint, options = {}) {
    const url = `${baseURL}/v1${endpoint}`;
    return await apiClient.makeRequest(url, options);
  }

  /**
   * Get users from PingOne
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Users response
   */
  async function getUsers(options = {}) {
    const queryParams = new URLSearchParams(options).toString();
    const endpoint = `/environments/${settings.environmentId}/users${queryParams ? `?${queryParams}` : ''}`;
    return await pingOneRequest(endpoint, {
      method: 'GET'
    });
  }

  /**
   * Create user in PingOne
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Create user response
   */
  async function createUser(userData) {
    const endpoint = `/environments/${settings.environmentId}/users`;
    return await pingOneRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  /**
   * Update user in PingOne
   * @param {string} userId - User ID
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Update user response
   */
  async function updateUser(userId, userData) {
    const endpoint = `/environments/${settings.environmentId}/users/${userId}`;
    return await pingOneRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  /**
   * Delete user from PingOne
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Delete user response
   */
  async function deleteUser(userId) {
    const endpoint = `/environments/${settings.environmentId}/users/${userId}`;
    return await pingOneRequest(endpoint, {
      method: 'DELETE'
    });
  }

  /**
   * Get populations from PingOne
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Populations response
   */
  async function getPopulations(options = {}) {
    const queryParams = new URLSearchParams(options).toString();
    const endpoint = `/environments/${settings.environmentId}/populations${queryParams ? `?${queryParams}` : ''}`;
    return await pingOneRequest(endpoint, {
      method: 'GET'
    });
  }

  /**
   * Create population in PingOne
   * @param {Object} populationData - Population data
   * @returns {Promise<Object>} Create population response
   */
  async function createPopulation(populationData) {
    const endpoint = `/environments/${settings.environmentId}/populations`;
    return await pingOneRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(populationData)
    });
  }

  /**
   * Delete population from PingOne
   * @param {string} populationId - Population ID
   * @returns {Promise<Object>} Delete population response
   */
  async function deletePopulation(populationId) {
    const endpoint = `/environments/${settings.environmentId}/populations/${populationId}`;
    return await pingOneRequest(endpoint, {
      method: 'DELETE'
    });
  }
  return {
    // API methods
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    getPopulations,
    createPopulation,
    deletePopulation,
    // Token management
    getTokenInfo: apiClient.getTokenInfo,
    updateSettings: apiClient.updateSettings,
    // Raw request method
    request: pingOneRequest
  };
}

/**
 * API Factory class - Backward compatibility
 */
class APIFactory {
  /**
   * Create a new APIFactory instance
   * @param {Object} logger - Logger instance
   * @param {Object} settingsManager - Settings manager instance
   */
  constructor(logger, settingsManager) {
    this.logger = logger || console;
    this.settingsManager = settingsManager;
    this.clients = new Map();
  }

  /**
   * Get or create a PingOne API client
   * @returns {PingOneClient} PingOne API client instance
   */
  getPingOneClient() {
    if (!this.clients.has('pingone')) {
      this.clients.set('pingone', new _pingoneClient.PingOneClient(this.logger, this.settingsManager));
    }
    return this.clients.get('pingone');
  }

  /**
   * Get or create a local API client
   * @param {string} [baseUrl=''] - Base URL for the API
   * @returns {LocalAPIClient} Local API client instance
   */
  getLocalClient(baseUrl = '') {
    const cacheKey = `local_${baseUrl}`;
    if (!this.clients.has(cacheKey)) {
      this.clients.set(cacheKey, new _localApiClient.LocalAPIClient(this.logger, baseUrl));
    }
    return this.clients.get(cacheKey);
  }

  /**
   * Get the default local API client (singleton)
   * @returns {LocalAPIClient} Default local API client instance
   */
  getDefaultLocalClient() {
    return _localApiClient.localAPIClient;
  }
}

// Create a singleton instance but don't export it directly
exports.APIFactory = APIFactory;
let _apiFactoryInstance = null;
let isInitializing = false;
let initializationPromise = null;

/**
 * Initialize the API factory with required dependencies
 * @param {Object} logger - Logger instance
 * @param {Object} settingsManager - Settings manager instance
 * @returns {Promise<APIFactory>} Initialized API factory instance
 */
const initAPIFactory = async (logger, settingsManager) => {
  // If already initialized, return the existing instance
  if (_apiFactoryInstance) {
    return _apiFactoryInstance;
  }

  // If initialization is in progress, wait for it to complete
  if (isInitializing) {
    if (initializationPromise) {
      return initializationPromise;
    }
  }

  // Set initialization flag and create a new promise
  isInitializing = true;
  initializationPromise = new Promise(async (resolve, reject) => {
    try {
      // Create the factory instance
      const factory = new APIFactory(logger, settingsManager);

      // Set the instance
      _apiFactoryInstance = factory;
      defaultAPIFactory = factory;

      // Log successful initialization
      if (logger && logger.info) {
        logger.info('API Factory initialized successfully');
      } else {
        console.log('API Factory initialized successfully');
      }
      resolve(factory);
    } catch (error) {
      const errorMsg = `Failed to initialize API Factory: ${error.message}`;
      if (logger && logger.error) {
        logger.error(errorMsg, {
          error
        });
      } else {
        console.error(errorMsg, error);
      }
      reject(new Error(errorMsg));
    } finally {
      isInitializing = false;
      initializationPromise = null;
    }
  });
  return initializationPromise;
};

// Export the singleton instance and initialization function
exports.initAPIFactory = initAPIFactory;
// For backward compatibility, export a default instance (will be initialized when initAPIFactory is called)
let defaultAPIFactory = null;
const apiFactory = exports.apiFactory = {
  getPingOneClient: () => {
    if (!defaultAPIFactory) {
      throw new Error('API Factory not initialized. Call initAPIFactory() first.');
    }
    return defaultAPIFactory.getPingOneClient();
  },
  getLocalClient: (baseUrl = '') => {
    if (!defaultAPIFactory) {
      throw new Error('API Factory not initialized. Call initAPIFactory() first.');
    }
    return defaultAPIFactory.getLocalClient(baseUrl);
  }
};

// For backward compatibility
const getAPIFactory = () => defaultAPIFactory;
exports.getAPIFactory = getAPIFactory;
var _default = exports.default = {
  createAutoRetryAPIClient,
  createPingOneAPIClient,
  initAPIFactory,
  apiFactory
};

},{"./local-api-client.js":49,"./pingone-client.js":52,"./token-manager.js":57,"@babel/runtime/helpers/interopRequireDefault":1}],41:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createCircularProgress = createCircularProgress;
/**
 * Circular Progress Spinner Component
 * Usage: createCircularProgress({ value, label, state, id })
 * - value: 0-100 (percent)
 * - label: status message (optional)
 * - state: '', 'error', 'warning', 'complete', 'ready' (optional)
 * - id: DOM id (optional)
 * 
 * Fixes visual duplication and rendering bugs in progress spinner during async operations
 */
function createCircularProgress({
  value = 0,
  label = '',
  state = '',
  id = ''
} = {}) {
  // Ensure proper sizing and rendering calculations
  const size = 80;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  // Clamp value between 0 and 100
  const percent = Math.max(0, Math.min(100, value));

  // Calculate stroke dash array for proper circular progress
  const dashOffset = circumference - percent / 100 * circumference;

  // Generate unique ID if not provided
  const elementId = id || `circular-progress-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Create wrapper element with proper state management
  const wrapper = document.createElement('div');
  wrapper.className = `circular-progress${state ? ' ' + state : ''}`;
  wrapper.id = elementId;
  wrapper.setAttribute('role', 'progressbar');
  wrapper.setAttribute('aria-valuenow', percent);
  wrapper.setAttribute('aria-valuemin', 0);
  wrapper.setAttribute('aria-valuemax', 100);
  wrapper.setAttribute('aria-label', label ? `${label} ${percent}%` : `${percent}%`);

  // Add data attributes for debugging and state tracking
  wrapper.setAttribute('data-percent', percent);
  wrapper.setAttribute('data-state', state);
  wrapper.setAttribute('data-created', new Date().toISOString());

  // Create SVG with proper viewBox and dimensions
  wrapper.innerHTML = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <!-- Background circle -->
      <circle 
        class="circular-bg" 
        cx="${size / 2}" 
        cy="${size / 2}" 
        r="${radius}" 
        fill="none"
        stroke="#e0e0e0"
        stroke-width="${stroke}"
      />
      <!-- Foreground progress circle -->
      <circle 
        class="circular-fg" 
        cx="${size / 2}" 
        cy="${size / 2}" 
        r="${radius}" 
        fill="none"
        stroke="var(--brand-color, #7c3aed)"
        stroke-width="${stroke}"
        stroke-linecap="round"
        stroke-dasharray="${circumference}"
        stroke-dashoffset="${dashOffset}"
        transform="rotate(-90 ${size / 2} ${size / 2})"
      />
    </svg>
    <!-- Percentage label -->
    <span class="circular-label">${Math.round(percent)}%</span>
    ${label ? `<span class="circular-status">${label}</span>` : ''}
  `;

  // Add debug logging for spinner creation
  console.debug('Circular Progress Created:', {
    id: elementId,
    percent,
    state,
    size,
    stroke,
    radius,
    circumference,
    dashOffset,
    label
  });
  return wrapper;
}

},{}],42:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.cryptoUtils = exports.CryptoUtils = void 0;
// File: crypto-utils.js
// Description: Cryptographic utilities for secure data handling
// 
// This module provides encryption and decryption functionality for
// sensitive data like API secrets and user credentials. Uses the
// Web Crypto API for secure cryptographic operations.
// 
// Features:
// - PBKDF2 key derivation for secure key generation
// - AES-GCM encryption for authenticated encryption
// - Base64 encoding for storage compatibility
// - Error handling for decryption failures

/**
 * Cryptographic Utilities Class
 * 
 * Provides secure encryption and decryption using the Web Crypto API.
 * Uses PBKDF2 for key derivation and AES-GCM for authenticated encryption.
 * All methods are static for easy use throughout the application.
 */
class CryptoUtils {
  /**
   * Generate a cryptographic key for encryption/decryption
   * 
   * Uses PBKDF2 key derivation to create a secure key from a password.
   * The key is suitable for AES-GCM encryption operations.
   * 
   * @param {string} password - The password to derive the key from
   * @returns {Promise<CryptoKey>} A CryptoKey object for encryption/decryption
   */
  static async generateKey(password) {
    // Convert password to key material using PBKDF2
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits', 'deriveKey']);

    // Derive the actual encryption key using PBKDF2
    return window.crypto.subtle.deriveKey({
      name: 'PBKDF2',
      salt: new TextEncoder().encode('PingOneImportSalt'),
      // Should be unique per user in production
      iterations: 100000,
      hash: 'SHA-256'
    }, keyMaterial, {
      name: 'AES-GCM',
      length: 256
    }, false, ['encrypt', 'decrypt']);
  }

  /**
   * Encrypt a string using AES-GCM
   * 
   * Encrypts text using AES-GCM with a random initialization vector (IV).
   * The IV is prepended to the encrypted data for secure storage.
   * Returns the result as base64-encoded string.
   * 
   * @param {string} text - The text to encrypt
   * @param {CryptoKey} key - The encryption key
   * @returns {Promise<string>} Encrypted text as base64 string
   */
  static async encrypt(text, key) {
    // Convert text to UTF-8 bytes
    const encoder = new TextEncoder();
    const data = encoder.encode(text);

    // Generate a random IV (Initialization Vector) for security
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // Encrypt the data using AES-GCM
    const encrypted = await window.crypto.subtle.encrypt({
      name: 'AES-GCM',
      iv
    }, key, data);

    // Combine IV and encrypted data into a single array
    // IV is prepended for secure storage and retrieval
    const result = new Uint8Array(iv.length + encrypted.byteLength);
    result.set(iv, 0);
    result.set(new Uint8Array(encrypted), iv.length);

    // Convert to base64 for storage compatibility
    return btoa(String.fromCharCode(...result));
  }

  /**
   * Decrypt a string
   * @param {string} encryptedBase64 - The encrypted text in base64 format
   * @param {CryptoKey} key - The decryption key
   * @returns {Promise<string>} Decrypted text
   */
  static async decrypt(encryptedBase64, key) {
    try {
      // Convert from base64 to Uint8Array
      const encryptedData = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));

      // Extract the IV (first 12 bytes)
      const iv = encryptedData.slice(0, 12);
      const data = encryptedData.slice(12);
      const decrypted = await window.crypto.subtle.decrypt({
        name: 'AES-GCM',
        iv
      }, key, data);
      return new TextDecoder().decode(decrypted);
    } catch (error) {
      // Don't log the error here - let the calling code handle it
      throw error;
    }
  }
}

// Export the class and a singleton instance
exports.CryptoUtils = CryptoUtils;
const cryptoUtils = exports.cryptoUtils = new CryptoUtils();

},{}],43:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DeleteManager = void 0;
/**
 * Delete Manager - Enhanced delete functionality with full environment deletion, confirmation, and logging
 * Handles file-based, population-based, and full environment user deletion
 */

class DeleteManager {
  constructor() {
    this.currentDeleteType = 'file';
    this.selectedFile = null;
    this.selectedPopulation = null;
    this.isEnvironmentDeleteConfirmed = false;
    this.isStandardDeleteConfirmed = false;
    this.deleteTextConfirmation = '';
    this.logger = console;

    // Only initialize if we're on a page with delete functionality
    if (document.getElementById('delete-file-section') || document.getElementById('delete-population-section') || document.getElementById('delete-environment-section') || document.getElementById('start-delete')) {
      try {
        this.initializeEventListeners();
        this.loadPopulations();
      } catch (error) {
        console.warn('DeleteManager initialization warning:', error);
      }
    }
  }
  initializeEventListeners() {
    // Delete type selection
    document.querySelectorAll('input[name="delete-type"]').forEach(radio => {
      radio.addEventListener('change', e => {
        this.currentDeleteType = e.target.value;
        this.updateDeleteSections();
        this.updateConfirmationSections();
        this.validateDeleteButton();
        this.logDeleteTypeChange();
      });
    });

    // File upload for delete
    const deleteFileInput = document.getElementById('delete-csv-file');
    const deleteDropZone = document.getElementById('delete-drop-zone');
    if (deleteFileInput) {
      deleteFileInput.addEventListener('change', e => {
        this.handleFileSelection(e.target.files[0]);
      });
    }
    if (deleteDropZone) {
      this.setupDragAndDrop(deleteDropZone, deleteFileInput);
    }

    // Population selection
    const populationSelect = document.getElementById('delete-population-select');
    if (populationSelect) {
      populationSelect.addEventListener('change', e => {
        this.selectedPopulation = e.target.value;
        this.validateDeleteButton();
        this.logPopulationSelection();
      });
    }

    // Standard confirmation
    const confirmDeleteCheckbox = document.getElementById('confirm-delete');
    if (confirmDeleteCheckbox) {
      confirmDeleteCheckbox.addEventListener('change', e => {
        this.isStandardDeleteConfirmed = e.target.checked;
        this.validateDeleteButton();
        this.logConfirmationChange('standard', e.target.checked);
      });
    }

    // Environment confirmation
    const confirmEnvironmentCheckbox = document.getElementById('confirm-environment-delete');
    const environmentDeleteText = document.getElementById('environment-delete-text');
    if (confirmEnvironmentCheckbox) {
      confirmEnvironmentCheckbox.addEventListener('change', e => {
        this.isEnvironmentDeleteConfirmed = e.target.checked;
        this.validateDeleteButton();
        this.logConfirmationChange('environment', e.target.checked);
      });
    }
    if (environmentDeleteText) {
      environmentDeleteText.addEventListener('input', e => {
        this.deleteTextConfirmation = e.target.value;
        this.validateDeleteButton();
        this.logTextConfirmationChange();
      });
    }

    // Start delete button
    const startDeleteBtn = document.getElementById('start-delete');
    if (startDeleteBtn) {
      startDeleteBtn.addEventListener('click', () => {
        this.startDelete();
      });
    }
  }
  setupDragAndDrop(dropZone, fileInput) {
    // Prevent default browser behavior for all drag events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, e => {
        e.preventDefault();
        e.stopPropagation();
      });
    });

    // Add visual feedback for drag events
    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, () => {
        dropZone.classList.add('dragover');
        this.logDragEvent('dragenter');
      });
    });
    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, () => {
        dropZone.classList.remove('dragover');
        if (eventName === 'drop') {
          this.logDragEvent('drop');
        }
      });
    });

    // Handle file drop
    dropZone.addEventListener('drop', e => {
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.handleFileSelection(files[0]);
        if (fileInput) {
          fileInput.files = files;
        }
      }
    });

    // Handle click to browse
    dropZone.addEventListener('click', () => {
      if (fileInput) {
        fileInput.click();
      }
    });

    // Add keyboard accessibility
    dropZone.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (fileInput) {
          fileInput.click();
        }
      }
    });
  }
  handleFileSelection(file) {
    if (!file) return;
    this.logFileSelection(file);
    this.selectedFile = file;
    this.displayFileInfo(file);
    this.validateDeleteButton();
  }
  displayFileInfo(file) {
    const fileInfo = document.getElementById('delete-file-info');
    if (!fileInfo) return;
    const fileSize = (file.size / 1024).toFixed(2);
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (fileExtension !== 'csv' && fileExtension !== 'txt') {
      fileInfo.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    <strong>Invalid file type:</strong> Please select a CSV or TXT file.
                </div>
            `;
      this.selectedFile = null;
      this.logFileValidationError('Invalid file type', fileExtension);
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      fileInfo.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    <strong>File too large:</strong> Please select a file smaller than 10MB.
                </div>
            `;
      this.selectedFile = null;
      this.logFileValidationError('File too large', file.size);
      return;
    }
    fileInfo.innerHTML = `
            <div class="file-info">
                <div class="file-name">${file.name}</div>
                <div class="file-meta">
                    <span>Size: ${fileSize} KB</span>
                    <span>Type: ${fileExtension.toUpperCase()}</span>
                </div>
            </div>
        `;
    this.logFileValidationSuccess(file);
  }
  async loadPopulations() {
    try {
      // Check if population select element exists before making API call
      const populationSelect = document.getElementById('delete-population-select');
      if (!populationSelect) {
        console.log('Delete population select not found, skipping population load');
        return;
      }
      this.logPopulationLoadStart();
      const response = await fetch('/api/populations');
      if (response.ok) {
        const data = await response.json();
        // Handle the API response structure: { success: true, populations: [...], total: 123 }
        const populations = data.populations || data;
        if (Array.isArray(populations)) {
          this.populatePopulationSelect(populations);
          this.logPopulationLoadSuccess(populations.length);
        } else {
          console.error('Invalid populations data format:', populations);
          this.logPopulationLoadError('Invalid populations data format');
        }
      } else {
        console.error('Failed to load populations');
        this.logPopulationLoadError('Failed to load populations');
      }
    } catch (error) {
      console.error('Error loading populations:', error);
      this.logPopulationLoadError(error.message);
    }
  }
  populatePopulationSelect(populations) {
    const select = document.getElementById('delete-population-select');
    if (!select) return;
    select.innerHTML = '<option value="">Select a population...</option>';
    populations.forEach(population => {
      const option = document.createElement('option');
      option.value = population.id;
      option.textContent = population.name;
      select.appendChild(option);
    });
  }
  updateDeleteSections() {
    const sections = {
      'file': document.getElementById('delete-file-section'),
      'population': document.getElementById('delete-population-section'),
      'environment': document.getElementById('delete-environment-section')
    };
    Object.keys(sections).forEach(type => {
      if (sections[type]) {
        sections[type].style.display = type === this.currentDeleteType ? 'block' : 'none';
      }
    });
  }
  updateConfirmationSections() {
    const standardConfirmation = document.getElementById('standard-confirmation');
    const environmentConfirmation = document.getElementById('environment-confirmation');
    if (standardConfirmation) {
      standardConfirmation.style.display = this.currentDeleteType === 'environment' ? 'none' : 'block';
    }
    if (environmentConfirmation) {
      environmentConfirmation.style.display = this.currentDeleteType === 'environment' ? 'block' : 'none';
    }
  }
  validateDeleteButton() {
    const startDeleteBtn = document.getElementById('start-delete');
    if (!startDeleteBtn) return;
    let isValid = false;
    switch (this.currentDeleteType) {
      case 'file':
        isValid = this.selectedFile && this.isStandardDeleteConfirmed;
        break;
      case 'population':
        isValid = this.selectedPopulation && this.isStandardDeleteConfirmed;
        break;
      case 'environment':
        isValid = this.isEnvironmentDeleteConfirmed && this.deleteTextConfirmation === 'DELETE ALL';
        break;
    }
    startDeleteBtn.disabled = !isValid;
    this.logButtonValidation(isValid);
  }
  async startDelete() {
    const startDeleteBtn = document.getElementById('start-delete');
    if (startDeleteBtn) {
      startDeleteBtn.disabled = true;
      startDeleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Starting Delete...';
    }
    try {
      let deleteData = {
        type: this.currentDeleteType,
        skipNotFound: document.getElementById('delete-skip-not-found')?.checked || false
      };
      switch (this.currentDeleteType) {
        case 'file':
          deleteData.file = this.selectedFile;
          break;
        case 'population':
          deleteData.populationId = this.selectedPopulation;
          break;
        case 'environment':
          deleteData.confirmation = this.deleteTextConfirmation;
          break;
      }
      this.logDeleteStart(deleteData);
      await this.performDelete(deleteData);
    } catch (error) {
      console.error('Delete failed:', error);
      this.showError('Delete operation failed. Please try again.');
      this.logDeleteError(error);
    } finally {
      if (startDeleteBtn) {
        startDeleteBtn.disabled = false;
        startDeleteBtn.innerHTML = '<i class="fas fa-trash"></i> Start Delete';
      }
    }
  }
  async performDelete(deleteData) {
    // Validate delete data
    if (!deleteData || !deleteData.type) {
      throw new Error('Invalid delete data: type is required');
    }

    // Validate based on delete type
    switch (deleteData.type) {
      case 'file':
        if (!deleteData.file) {
          throw new Error('File is required for file-based deletion');
        }
        break;
      case 'population':
        if (!deleteData.populationId) {
          throw new Error('Population ID is required for population-based deletion');
        }
        break;
      case 'environment':
        if (deleteData.confirmation !== 'DELETE ALL') {
          throw new Error('Environment deletion requires "DELETE ALL" confirmation');
        }
        break;
      default:
        throw new Error('Invalid delete type');
    }
    const formData = new FormData();
    formData.append('type', deleteData.type);
    formData.append('skipNotFound', deleteData.skipNotFound);
    if (deleteData.file) {
      formData.append('file', deleteData.file);
    }
    if (deleteData.populationId) {
      formData.append('populationId', deleteData.populationId);
    }
    if (deleteData.confirmation) {
      formData.append('confirmation', deleteData.confirmation);
    }
    const response = await fetch('/api/delete-users', {
      method: 'POST',
      body: formData
    });
    if (!response.ok) {
      let errorMessage = 'Delete operation failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
        console.error('Delete API error:', errorData);
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    const result = await response.json();
    this.showSuccess(`Delete operation completed successfully. ${result.deletedCount} users deleted.`);

    // Log the delete operation
    this.logDeleteOperation(deleteData, result);
  }
  logDeleteOperation(deleteData, result) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action: 'DELETE_USERS',
      type: deleteData.type,
      scope: this.getDeleteScope(deleteData),
      metadata: this.getDeleteMetadata(deleteData),
      result: {
        deletedCount: result.deletedCount,
        skippedCount: result.skippedCount || 0,
        errors: result.errors || []
      }
    };

    // Send to logging system
    if (window.logManager) {
      window.logManager.log('DELETE', 'User deletion completed', logEntry);
    }

    // Also log to console for debugging
    console.log('Delete operation logged:', logEntry);
  }
  getDeleteScope(deleteData) {
    switch (deleteData.type) {
      case 'file':
        return 'FILE_BASED';
      case 'population':
        return 'POPULATION_BASED';
      case 'environment':
        return 'FULL_ENVIRONMENT';
      default:
        return 'UNKNOWN';
    }
  }
  getDeleteMetadata(deleteData) {
    const metadata = {
      skipNotFound: deleteData.skipNotFound
    };
    switch (deleteData.type) {
      case 'file':
        metadata.fileName = deleteData.file?.name;
        metadata.fileSize = deleteData.file?.size;
        break;
      case 'population':
        metadata.populationId = deleteData.populationId;
        break;
      case 'environment':
        metadata.confirmationProvided = !!deleteData.confirmation;
        break;
    }
    return metadata;
  }

  // Enhanced logging methods
  logDeleteTypeChange() {
    if (window.logManager && typeof window.logManager.log === 'function') {
      window.logManager.log('info', 'Delete type changed', {
        type: this.currentDeleteType,
        timestamp: new Date().toISOString()
      });
    } else {
      console.info('Delete type changed:', {
        type: this.currentDeleteType,
        timestamp: new Date().toISOString()
      });
    }
  }
  logFileSelection(file) {
    if (window.logManager && typeof window.logManager.log === 'function') {
      window.logManager.log('info', 'File selected for deletion', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        timestamp: new Date().toISOString()
      });
    } else {
      console.info('File selected for deletion:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });
    }
  }
  logFileValidationError(error, details) {
    if (window.logManager && typeof window.logManager.log === 'function') {
      window.logManager.log('warn', 'File validation failed', {
        error: error,
        details: details,
        timestamp: new Date().toISOString()
      });
    } else {
      console.warn('File validation failed:', {
        error,
        details,
        timestamp: new Date().toISOString()
      });
    }
  }
  logFileValidationSuccess(file) {
    if (window.logManager && typeof window.logManager.log === 'function') {
      window.logManager.log('info', 'File validation successful', {
        fileName: file.name,
        fileSize: file.size,
        timestamp: new Date().toISOString()
      });
    } else {
      console.info('File validation successful:', {
        fileName: file.name,
        fileSize: file.size,
        timestamp: new Date().toISOString()
      });
    }
  }
  logDragEvent(eventType) {
    if (window.logManager && typeof window.logManager.log === 'function') {
      window.logManager.log('debug', 'Drag event', {
        eventType: eventType,
        timestamp: new Date().toISOString()
      });
    } else {
      console.debug('Drag event:', {
        eventType,
        timestamp: new Date().toISOString()
      });
    }
  }
  logPopulationLoadStart() {
    if (window.logManager && typeof window.logManager.log === 'function') {
      window.logManager.log('info', 'Loading populations for delete', {
        timestamp: new Date().toISOString()
      });
    } else {
      console.info('Loading populations for delete:', {
        timestamp: new Date().toISOString()
      });
    }
  }
  logPopulationLoadSuccess(count) {
    if (window.logManager && typeof window.logManager.log === 'function') {
      window.logManager.log('info', 'Populations loaded successfully', {
        count: count,
        timestamp: new Date().toISOString()
      });
    } else {
      console.info('Populations loaded successfully:', {
        count,
        timestamp: new Date().toISOString()
      });
    }
  }
  logPopulationLoadError(error) {
    if (window.logManager && typeof window.logManager.log === 'function') {
      window.logManager.log('error', 'Failed to load populations', {
        error: error,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('Failed to load populations:', {
        error,
        timestamp: new Date().toISOString()
      });
    }
  }
  logPopulationSelection() {
    if (window.logManager && typeof window.logManager.log === 'function') {
      window.logManager.log('info', 'Population selected for deletion', {
        populationId: this.selectedPopulation,
        timestamp: new Date().toISOString()
      });
    } else {
      console.info('Population selected for deletion:', {
        populationId: this.selectedPopulation,
        timestamp: new Date().toISOString()
      });
    }
  }
  logConfirmationChange(type, confirmed) {
    if (window.logManager && typeof window.logManager.log === 'function') {
      window.logManager.log('info', 'Delete confirmation changed', {
        type: type,
        confirmed: confirmed,
        timestamp: new Date().toISOString()
      });
    } else {
      console.info('Delete confirmation changed:', {
        type,
        confirmed,
        timestamp: new Date().toISOString()
      });
    }
  }
  logTextConfirmationChange() {
    if (window.logManager && typeof window.logManager.log === 'function') {
      window.logManager.log('debug', 'Environment delete text confirmation changed', {
        textLength: this.deleteTextConfirmation.length,
        timestamp: new Date().toISOString()
      });
    } else {
      console.debug('Environment delete text confirmation changed:', {
        textLength: this.deleteTextConfirmation.length,
        timestamp: new Date().toISOString()
      });
    }
  }
  logButtonValidation(isValid) {
    if (window.logManager && typeof window.logManager.log === 'function') {
      window.logManager.log('debug', 'Delete button validation', {
        isValid: isValid,
        deleteType: this.currentDeleteType,
        timestamp: new Date().toISOString()
      });
    } else {
      console.debug('Delete button validation:', {
        isValid,
        deleteType: this.currentDeleteType,
        timestamp: new Date().toISOString()
      });
    }
  }
  logDeleteStart(deleteData) {
    if (window.logManager && typeof window.logManager.log === 'function') {
      window.logManager.log('info', 'Delete operation started', {
        type: deleteData.type,
        scope: this.getDeleteScope(deleteData),
        metadata: this.getDeleteMetadata(deleteData),
        timestamp: new Date().toISOString()
      });
    } else {
      console.info('Delete operation started:', {
        type: deleteData.type,
        scope: this.getDeleteScope(deleteData),
        metadata: this.getDeleteMetadata(deleteData),
        timestamp: new Date().toISOString()
      });
    }
  }
  logDeleteError(error) {
    if (window.logManager && typeof window.logManager.log === 'function') {
      window.logManager.log('error', 'Delete operation failed', {
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('Delete operation failed:', {
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
  showSuccess(message) {
    if (window.uiManager) {
      window.uiManager.showStatusMessage('success', 'Delete Complete', message);
    } else {
      alert(message);
    }
  }
  showError(message) {
    if (window.uiManager) {
      window.uiManager.showStatusMessage('error', 'Delete Failed', message);
    } else {
      alert('Error: ' + message);
    }
  }
}

// Initialize delete manager when DOM is loaded
// Only initialize if delete UI elements exist
exports.DeleteManager = DeleteManager;
function hasDeleteUI() {
  return document.getElementById('delete-file-section') || document.getElementById('delete-population-section') || document.getElementById('delete-environment-section');
}
document.addEventListener('DOMContentLoaded', () => {
  if (hasDeleteUI()) {
    try {
      window.deleteManager = new DeleteManager();
    } catch (error) {
      console.error('Failed to initialize DeleteManager:', error);
    }
  } else {
    window.deleteManager = null;
  }
});

// Export for ES6 module system

},{}],44:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ElementRegistry = void 0;
// ElementRegistry: Centralized DOM element lookup utility
// Provides safe, memoized access to all required UI elements with logging for missing elements
// Usage: import { ElementRegistry } from './element-registry.js';

const elementCache = {};
function getElement(selector, description, required = true) {
  // Input validation
  if (!selector || typeof selector !== 'string') {
    console.error(`[ElementRegistry] Invalid selector provided: ${selector}`);
    return null;
  }

  // Security: Prevent potential XSS through selector injection
  // Allow valid attribute selectors with quotes but prevent script injection
  if (selector.includes('<') || selector.includes('>') || selector.includes('"') && !selector.includes('[') && !selector.includes(']') || selector.includes("'") && !selector.includes('[') && !selector.includes(']')) {
    console.error(`[ElementRegistry] Potentially unsafe selector detected: ${selector}`);
    return null;
  }

  // Check cache first
  if (elementCache[selector]) {
    return elementCache[selector];
  }
  try {
    const el = document.querySelector(selector);
    if (!el && required) {
      console.warn(`[ElementRegistry] Missing required element: ${description} (${selector})`);
    } else if (!el) {
      console.info(`[ElementRegistry] Optional element not found: ${description} (${selector})`);
    } else {
      // Validate element is still in DOM
      if (!document.contains(el)) {
        console.warn(`[ElementRegistry] Element found but not in DOM: ${description} (${selector})`);
        elementCache[selector] = null;
        return null;
      }
    }
    elementCache[selector] = el;
    return el;
  } catch (error) {
    console.error(`[ElementRegistry] Error finding element: ${description} (${selector})`, error);
    elementCache[selector] = null;
    return null;
  }
}
const ElementRegistry = exports.ElementRegistry = {
  // Main UI elements
  importButton: () => getElement('#import-btn', 'Import Button'),
  fileInput: () => getElement('#csv-file', 'File Input'),
  statusBar: () => getElement('#status-bar', 'Status Bar'),
  dashboardTab: () => getElement('#dashboard-tab', 'Dashboard Tab'),
  dragDropArea: () => getElement('#drag-drop-area', 'Drag-and-Drop Area', false),
  // Notification and progress containers
  notificationContainer: () => getElement('#notification-area', 'Notification Container'),
  progressContainer: () => getElement('#progress-container', 'Progress Container'),
  // Token and connection status elements
  tokenStatus: () => getElement('#universal-token-status', 'Token Status'),
  connectionStatus: () => getElement('#connection-status', 'Connection Status'),
  currentTokenStatus: () => getElement('#current-token-status', 'Current Token Status'),
  universalTokenStatus: () => getElement('#universal-token-status', 'Universal Token Status'),
  homeTokenStatus: () => getElement('#home-token-status', 'Home Token Status'),
  // File handling elements
  fileInfo: () => getElement('#file-info', 'File Info'),
  previewContainer: () => getElement('#dashboard-preview', 'Preview Container'),
  fileInputLabel: () => getElement('label[for="csv-file"]', 'File Input Label'),
  deleteFileInput: () => getElement('#delete-csv-file', 'Delete File Input'),
  deleteFileInputLabel: () => getElement('label[for="delete-csv-file"]', 'Delete File Input Label'),
  modifyFileInput: () => getElement('#modify-csv-file', 'Modify File Input'),
  modifyFileInputLabel: () => getElement('label[for="modify-csv-file"]', 'Modify File Input Label'),
  // Population selection elements
  importPopulationSelect: () => getElement('#import-population-select', 'Import Population Select'),
  deletePopulationSelect: () => getElement('#delete-population-select', 'Delete Population Select'),
  modifyPopulationSelect: () => getElement('#modify-population-select', 'Modify Population Select'),
  dashboardPopulationSelect: () => getElement('#dashboard-population-select', 'Dashboard Population Select'),
  // Import buttons
  startImportBtn: () => getElement('#start-import', 'Start Import Button'),
  startImportBtnBottom: () => getElement('#bottom-start-import', 'Bottom Start Import Button'),
  // Settings elements
  settingsSaveStatus: () => getElement('#settings-save-status', 'Settings Save Status'),
  // Import status elements
  importStatus: () => getElement('#import-status', 'Import Status'),
  // Population checkboxes
  useDefaultPopulationCheckbox: () => getElement('#use-default-population', 'Use Default Population Checkbox'),
  useCsvPopulationIdCheckbox: () => getElement('#use-csv-population-id', 'Use CSV Population ID Checkbox'),
  // Get Token button
  getTokenBtn: () => getElement('#get-token-quick', 'Get Token Button'),
  // Population ID form field
  populationIdField: () => getElement('#population-id', 'Population ID Field')
};

},{}],45:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ExportManager = void 0;
/**
 * Export Manager - Enhanced export functionality with population selection, credential overrides, token handling, and JWT decoding
 * Handles all export operations with comprehensive token management and user transparency
 */

class ExportManager {
  constructor() {
    this.exportToken = null;
    this.tokenExpiration = null;
    this.tokenTimer = null;
    this.overrideCredentials = false;
    this.populations = [];
    this.logger = console;

    // Only initialize if we're on a page with export functionality
    if (document.getElementById('export-population-select') || document.getElementById('export-format') || document.getElementById('start-export')) {
      try {
        this.initializeEventListeners();
        this.loadPopulations();
        this.loadStoredCredentials();
        this.startTokenTimer();
      } catch (error) {
        console.warn('ExportManager initialization warning:', error);
      }
    }
  }
  initializeEventListeners() {
    // Population selection
    const populationSelect = document.getElementById('export-population-select');
    if (populationSelect) {
      populationSelect.addEventListener('change', e => {
        this.validateExportButton();
        this.logPopulationSelection();
      });
    }

    // Credential override toggle
    const overrideCheckbox = document.getElementById('export-use-override-credentials');
    if (overrideCheckbox) {
      overrideCheckbox.addEventListener('change', e => {
        this.toggleCredentialsOverride(e.target.checked);
      });
    }

    // Generate export token
    const generateTokenBtn = document.getElementById('generate-export-token');
    if (generateTokenBtn) {
      generateTokenBtn.addEventListener('click', () => {
        this.generateExportToken();
      });
    }

    // View raw token
    const viewTokenBtn = document.getElementById('view-export-token');
    if (viewTokenBtn) {
      viewTokenBtn.addEventListener('click', () => {
        this.showJWTDecoder();
      });
    }

    // Refresh token
    const refreshTokenBtn = document.getElementById('refresh-export-token');
    if (refreshTokenBtn) {
      refreshTokenBtn.addEventListener('click', () => {
        this.refreshExportToken();
      });
    }

    // JWT panel close
    const closeJwtBtn = document.getElementById('close-jwt-panel');
    if (closeJwtBtn) {
      closeJwtBtn.addEventListener('click', () => {
        this.hideJWTDecoder();
      });
    }

    // Copy buttons
    this.setupCopyButtons();

    // Start export
    const startExportBtn = document.getElementById('start-export');
    if (startExportBtn) {
      startExportBtn.addEventListener('click', () => {
        this.startExport();
      });
    }

    // Secret visibility toggle
    const toggleSecretBtn = document.getElementById('toggle-export-secret-visibility');
    if (toggleSecretBtn) {
      toggleSecretBtn.addEventListener('click', () => {
        this.toggleSecretVisibility();
      });
    }
  }
  async loadPopulations() {
    try {
      // Check if population select element exists before making API call
      const populationSelect = document.getElementById('export-population-select');
      if (!populationSelect) {
        console.log('Export population select not found, skipping population load');
        return;
      }
      this.logPopulationLoadStart();
      const response = await fetch('/api/populations');
      if (response.ok) {
        const data = await response.json();
        // Handle the API response structure: { success: true, populations: [...], total: 123 }
        const populations = data.populations || data;
        if (Array.isArray(populations)) {
          this.populations = populations;
          this.populatePopulationSelect(populations);
          this.logPopulationLoadSuccess(populations.length);
        } else {
          console.error('Invalid populations data format:', populations);
          this.logPopulationLoadError('Invalid populations data format');
        }
      } else {
        console.error('Failed to load populations');
        this.logPopulationLoadError('Failed to load populations');
      }
    } catch (error) {
      console.error('Error loading populations:', error);
      this.logPopulationLoadError(error.message);
    }
  }
  populatePopulationSelect(populations) {
    const select = document.getElementById('export-population-select');
    if (!select) return;

    // Keep the existing ALL option and add populations
    const allOption = select.querySelector('option[value="ALL"]');
    select.innerHTML = '<option value="">Select a population...</option>';
    if (allOption) {
      select.appendChild(allOption);
    }
    populations.forEach(population => {
      const option = document.createElement('option');
      option.value = population.id;
      option.textContent = population.name;
      select.appendChild(option);
    });
  }
  toggleCredentialsOverride(enabled) {
    this.overrideCredentials = enabled;
    const credentialsFields = document.getElementById('export-credentials-form');
    const tokenStatus = document.getElementById('export-token-status');
    if (enabled) {
      credentialsFields.style.display = 'block';
      this.loadStoredCredentials();
    } else {
      credentialsFields.style.display = 'none';
      tokenStatus.style.display = 'none';
      this.clearExportToken();
    }
    this.validateExportButton();
    this.logCredentialOverride(enabled);
  }
  loadStoredCredentials() {
    try {
      const stored = localStorage.getItem('exportCredentials');
      if (stored) {
        const credentials = JSON.parse(stored);
        document.getElementById('export-environment-id').value = credentials.environmentId || '';
        document.getElementById('export-api-client-id').value = credentials.apiClientId || '';
        document.getElementById('export-api-secret').value = credentials.apiSecret || '';
        document.getElementById('export-region').value = credentials.region || 'NA';
      }
    } catch (error) {
      console.error('Error loading stored credentials:', error);
    }
  }
  saveCredentials() {
    try {
      const credentials = {
        environmentId: document.getElementById('export-environment-id').value,
        apiClientId: document.getElementById('export-api-client-id').value,
        apiSecret: document.getElementById('export-api-secret').value,
        region: document.getElementById('export-region').value
      };
      localStorage.setItem('exportCredentials', JSON.stringify(credentials));
    } catch (error) {
      console.error('Error saving credentials:', error);
    }
  }
  async generateExportToken() {
    try {
      const credentials = this.getExportCredentials();
      if (!credentials) {
        this.showError('Please fill in all credential fields');
        return;
      }
      this.saveCredentials();
      const response = await fetch('/api/export-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });
      if (response.ok) {
        const result = await response.json();
        this.setExportToken(result.token, result.expiresAt);
        this.logTokenGeneration('success');
      } else {
        const error = await response.json();
        this.showError('Failed to generate token: ' + error.message);
        this.logTokenGeneration('error', error.message);
      }
    } catch (error) {
      this.showError('Error generating token: ' + error.message);
      this.logTokenGeneration('error', error.message);
    }
  }
  async refreshExportToken() {
    if (!this.overrideCredentials) {
      this.showError('Credential override must be enabled to refresh token');
      return;
    }
    await this.generateExportToken();
  }
  getExportCredentials() {
    const environmentId = document.getElementById('export-environment-id').value;
    const apiClientId = document.getElementById('export-api-client-id').value;
    const apiSecret = document.getElementById('export-api-secret').value;
    const region = document.getElementById('export-region').value;
    if (!environmentId || !apiClientId || !apiSecret) {
      return null;
    }
    return {
      environmentId,
      apiClientId,
      apiSecret,
      region
    };
  }
  setExportToken(token, expiresAt) {
    this.exportToken = token;
    this.tokenExpiration = new Date(expiresAt);

    // Store in localStorage
    localStorage.setItem('exportToken', token);
    localStorage.setItem('exportTokenExpires', expiresAt);

    // Show token status
    document.getElementById('export-token-status').style.display = 'block';

    // Update token metadata
    this.updateTokenMetadata();

    // Start timer
    this.startTokenTimer();
    this.validateExportButton();
    this.logTokenSet();
  }
  clearExportToken() {
    this.exportToken = null;
    this.tokenExpiration = null;

    // Clear from localStorage
    localStorage.removeItem('exportToken');
    localStorage.removeItem('exportTokenExpires');

    // Hide token status
    document.getElementById('export-token-status').style.display = 'none';

    // Stop timer
    if (this.tokenTimer) {
      clearInterval(this.tokenTimer);
      this.tokenTimer = null;
    }
    this.validateExportButton();
  }
  startTokenTimer() {
    if (this.tokenTimer) {
      clearInterval(this.tokenTimer);
    }
    this.tokenTimer = setInterval(() => {
      this.updateTokenTimer();
    }, 1000);
    this.updateTokenTimer();
  }
  updateTokenTimer() {
    if (!this.tokenExpiration) return;
    const now = new Date();
    const timeLeft = this.tokenExpiration.getTime() - now.getTime();
    if (timeLeft <= 0) {
      // Token expired
      this.clearExportToken();
      this.showError('Export token has expired. Please generate a new token.');
      return;
    }
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor(timeLeft % 60000 / 1000);
    const timerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('export-token-timer').textContent = timerText;

    // Update status indicator
    const indicator = document.getElementById('export-token-status-indicator');
    if (timeLeft < 300000) {
      // Less than 5 minutes
      indicator.className = 'token-status-indicator expired';
    } else if (timeLeft < 600000) {
      // Less than 10 minutes
      indicator.className = 'token-status-indicator warning';
    } else {
      indicator.className = 'token-status-indicator valid';
    }
  }
  updateTokenMetadata() {
    if (!this.exportToken) return;
    try {
      const decoded = this.decodeJWT(this.exportToken);
      document.getElementById('export-token-scopes').textContent = decoded.payload.scope || '--';
      document.getElementById('export-token-environment').textContent = decoded.payload.env || '--';
      document.getElementById('export-token-expires').textContent = new Date(decoded.payload.exp * 1000).toISOString();
    } catch (error) {
      console.error('Error updating token metadata:', error);
    }
  }
  decodeJWT(token) {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    const header = JSON.parse(atob(parts[0]));
    const payload = JSON.parse(atob(parts[1]));
    const signature = parts[2];
    return {
      header,
      payload,
      signature,
      raw: token
    };
  }
  showJWTDecoder() {
    if (!this.exportToken) {
      this.showError('No export token available');
      return;
    }
    try {
      const decoded = this.decodeJWT(this.exportToken);
      document.getElementById('export-jwt-raw').textContent = decoded.raw;
      document.getElementById('export-jwt-header').textContent = JSON.stringify(decoded.header, null, 2);
      document.getElementById('export-jwt-payload').textContent = JSON.stringify(decoded.payload, null, 2);
      document.getElementById('export-jwt-signature').textContent = decoded.signature;
      document.getElementById('export-jwt-panel').style.display = 'block';
      this.logJWTView();
    } catch (error) {
      this.showError('Error decoding JWT: ' + error.message);
    }
  }
  hideJWTDecoder() {
    document.getElementById('export-jwt-panel').style.display = 'none';
  }
  setupCopyButtons() {
    const copyButtons = [{
      id: 'copy-jwt-raw',
      target: 'export-jwt-raw'
    }, {
      id: 'copy-jwt-header',
      target: 'export-jwt-header'
    }, {
      id: 'copy-jwt-payload',
      target: 'export-jwt-payload'
    }, {
      id: 'copy-jwt-signature',
      target: 'export-jwt-signature'
    }];
    copyButtons.forEach(button => {
      const btn = document.getElementById(button.id);
      if (btn) {
        btn.addEventListener('click', () => {
          this.copyToClipboard(button.target);
        });
      }
    });
  }
  async copyToClipboard(elementId) {
    try {
      const element = document.getElementById(elementId);
      const text = element.textContent;
      await navigator.clipboard.writeText(text);
      this.showSuccess('Copied to clipboard');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      this.showError('Failed to copy to clipboard');
    }
  }
  toggleSecretVisibility() {
    const secretInput = document.getElementById('export-api-secret');
    const toggleBtn = document.getElementById('toggle-export-secret-visibility');
    const icon = toggleBtn.querySelector('i');
    if (secretInput.type === 'password') {
      secretInput.type = 'text';
      icon.className = 'fas fa-eye-slash';
    } else {
      secretInput.type = 'password';
      icon.className = 'fas fa-eye';
    }
  }
  validateExportButton() {
    const startExportBtn = document.getElementById('start-export');
    const populationSelect = document.getElementById('export-population-select');
    if (!startExportBtn || !populationSelect) return;
    const hasPopulation = populationSelect.value;
    const hasToken = this.overrideCredentials ? this.exportToken : true;
    startExportBtn.disabled = !hasPopulation || !hasToken;
  }
  async startExport() {
    const populationSelect = document.getElementById('export-population-select');
    const selectedPopulation = populationSelect.value;
    if (!selectedPopulation) {
      this.showError('Please select a population');
      return;
    }
    if (this.overrideCredentials && !this.exportToken) {
      this.showError('Please generate an export token first');
      return;
    }
    try {
      const exportOptions = this.getExportOptions();
      this.logExportStart(exportOptions);

      // Show export status
      if (window.uiManager) {
        window.uiManager.showExportStatus();
      }

      // Send export request
      const response = await fetch('/api/export-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(exportOptions)
      });
      if (response.ok) {
        const result = await response.json();
        this.showSuccess('Export completed successfully', result.message);
        this.logExportSuccess(result);
        this.showExportReminder();
      } else {
        const error = await response.json();
        this.showError('Export failed: ' + error.message);
        this.logExportError(error.message);
      }
    } catch (error) {
      this.showError('Export failed: ' + error.message);
      this.logExportError(error.message);
    }
  }
  getExportOptions() {
    const populationSelect = document.getElementById('export-population-select');
    const selectedPopulation = populationSelect.value;
    const selectedPopulationName = populationSelect.selectedOptions[0]?.text || '';
    return {
      populationId: selectedPopulation,
      populationName: selectedPopulationName,
      userStatusFilter: document.getElementById('export-population-filter').value,
      format: document.getElementById('export-format').value,
      includeDisabled: document.getElementById('export-include-disabled').checked,
      includeMetadata: document.getElementById('export-include-metadata').checked,
      useOverrideCredentials: this.overrideCredentials,
      exportToken: this.overrideCredentials ? this.exportToken : null
    };
  }
  showExportReminder() {
    if (this.overrideCredentials) {
      this.showInfo('Export completed', 'Remember to get a new token before using Import, Delete, or Modify operations.');
    }
  }

  // Logging methods
  logPopulationLoadStart() {
    if (window.logManager && typeof window.logManager.log === 'function') {
      window.logManager.log('info', 'Loading populations for export', {
        timestamp: new Date().toISOString()
      });
    } else {
      console.info('Loading populations for export:', {
        timestamp: new Date().toISOString()
      });
    }
  }
  logPopulationLoadSuccess(count) {
    if (window.logManager && typeof window.logManager.log === 'function') {
      window.logManager.log('info', 'Populations loaded successfully for export', {
        count: count,
        timestamp: new Date().toISOString()
      });
    } else {
      console.info('Populations loaded successfully for export:', {
        count,
        timestamp: new Date().toISOString()
      });
    }
  }
  logPopulationLoadError(error) {
    if (window.logManager && typeof window.logManager.log === 'function') {
      window.logManager.log('error', 'Failed to load populations for export', {
        error: error,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('Failed to load populations for export:', error);
    }
  }
  logPopulationSelection() {
    const populationSelect = document.getElementById('export-population-select');
    if (window.logManager && typeof window.logManager.log === 'function') {
      window.logManager.log('info', 'Population selected for export', {
        populationId: populationSelect.value,
        populationName: populationSelect.selectedOptions[0]?.text || '',
        timestamp: new Date().toISOString()
      });
    } else {
      console.info('Population selected for export:', {
        populationId: populationSelect.value,
        populationName: populationSelect.selectedOptions[0]?.text || '',
        timestamp: new Date().toISOString()
      });
    }
  }
  logCredentialOverride(enabled) {
    if (window.logManager && typeof window.logManager.log === 'function') {
      window.logManager.log('info', 'Export credential override toggled', {
        enabled: enabled,
        timestamp: new Date().toISOString()
      });
    } else {
      console.info('Export credential override toggled:', {
        enabled,
        timestamp: new Date().toISOString()
      });
    }
  }
  logTokenGeneration(status, error = null) {
    if (window.logManager && typeof window.logManager.log === 'function') {
      window.logManager.log(status === 'success' ? 'info' : 'error', 'Export token generation', {
        status: status,
        error: error,
        timestamp: new Date().toISOString()
      });
    } else {
      console[status === 'success' ? 'info' : 'error']('Export token generation:', {
        status,
        error,
        timestamp: new Date().toISOString()
      });
    }
  }
  logTokenSet() {
    if (window.logManager && typeof window.logManager.log === 'function') {
      window.logManager.log('info', 'Export token set', {
        hasToken: !!this.exportToken,
        expiresAt: this.tokenExpiration?.toISOString(),
        timestamp: new Date().toISOString()
      });
    } else {
      console.info('Export token set:', {
        hasToken: !!this.exportToken,
        expiresAt: this.tokenExpiration?.toISOString(),
        timestamp: new Date().toISOString()
      });
    }
  }
  logJWTView() {
    if (window.logManager && typeof window.logManager.log === 'function') {
      window.logManager.log('info', 'JWT token viewed', {
        timestamp: new Date().toISOString()
      });
    } else {
      console.info('JWT token viewed:', {
        timestamp: new Date().toISOString()
      });
    }
  }
  logExportStart(options) {
    if (window.logManager && typeof window.logManager.log === 'function') {
      window.logManager.log('info', 'Export operation started', {
        options: options,
        timestamp: new Date().toISOString()
      });
    } else {
      console.info('Export operation started:', {
        options,
        timestamp: new Date().toISOString()
      });
    }
  }
  logExportSuccess(result) {
    if (window.logManager && typeof window.logManager.log === 'function') {
      window.logManager.log('info', 'Export operation completed successfully', {
        result: result,
        timestamp: new Date().toISOString()
      });
    } else {
      console.info('Export operation completed successfully:', {
        result,
        timestamp: new Date().toISOString()
      });
    }
  }
  logExportError(error) {
    if (window.logManager && typeof window.logManager.log === 'function') {
      window.logManager.log('error', 'Export operation failed', {
        error: error,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('Export operation failed:', {
        error,
        timestamp: new Date().toISOString()
      });
    }
  }
  showSuccess(title, message) {
    if (window.uiManager) {
      window.uiManager.showStatusMessage('success', title, message);
    } else {
      alert(`${title}: ${message}`);
    }
  }
  showError(message) {
    if (window.uiManager) {
      window.uiManager.showStatusMessage('error', 'Export Error', message);
    } else {
      alert('Error: ' + message);
    }
  }
  showInfo(title, message) {
    if (window.uiManager) {
      window.uiManager.showStatusMessage('info', title, message);
    } else {
      console.log(`${title}: ${message}`);
    }
  }
}

// Initialize export manager when DOM is loaded
// Only initialize if export UI elements exist
exports.ExportManager = ExportManager;
function hasExportUI() {
  return document.getElementById('export-population-select') || document.getElementById('export-format') || document.getElementById('start-export');
}
document.addEventListener('DOMContentLoaded', () => {
  if (hasExportUI()) {
    try {
      window.exportManager = new ExportManager();
    } catch (error) {
      console.error('Failed to initialize ExportManager:', error);
    }
  } else {
    window.exportManager = null;
  }
});

// Export for ES6 module system

},{}],46:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FileHandler = void 0;
var _elementRegistry = require("./element-registry.js");
// File: file-handler.js
// Description: CSV file processing and validation for PingOne user import
// 
// This module handles all file-related operations including:
// - CSV file reading and parsing
// - User data validation and error checking
// - File preview generation
// - File information display and management
// - Folder path tracking for better UX
// - Validation summary and error reporting
// 
// Provides comprehensive CSV processing with detailed validation feedback.

/**
 * File Handler Class
 * 
 * Manages CSV file processing, validation, and user data preparation
 * for the PingOne import tool. Handles file selection, parsing,
 * validation, and preview generation.
 * 
 * @param {Object} logger - Logger instance for debugging
 * @param {Object} uiManager - UI manager for status updates
 */
class FileHandler {
  constructor(logger, uiManager) {
    this.logger = logger;
    this.uiManager = uiManager;

    // Required fields for user validation
    this.requiredFields = ['username'];

    // Validation tracking for processed files
    this.validationResults = {
      total: 0,
      valid: 0,
      errors: 0,
      warnings: 0
    };

    // File processing state
    this.lastParsedUsers = [];
    this.currentFile = null;

    // Initialize UI elements for file handling
    this.fileInput = _elementRegistry.ElementRegistry.fileInput ? _elementRegistry.ElementRegistry.fileInput() : null;
    this.fileInfo = _elementRegistry.ElementRegistry.fileInfo ? _elementRegistry.ElementRegistry.fileInfo() : null;
    this.previewContainer = _elementRegistry.ElementRegistry.previewContainer ? _elementRegistry.ElementRegistry.previewContainer() : null;

    // Load last file info from localStorage for better UX
    this.lastFileInfo = this.loadLastFileInfo();

    // Initialize event listeners for file input
    this.initializeFileInput();
  }

  // ======================
  // File Info Management
  // ======================

  loadLastFileInfo() {
    try {
      const savedFile = localStorage.getItem('lastSelectedFile');
      return savedFile ? JSON.parse(savedFile) : null;
    } catch (error) {
      this.logger.error('Error loading last file info:', error);
      return null;
    }
  }

  /**
   * Get the current file being processed
   * 
   * Returns the File object that is currently loaded and ready for processing.
   * Used by other modules to access the file for upload operations.
   * 
   * @returns {File|null} The current file or null if none is loaded
   */
  getCurrentFile() {
    return this.currentFile;
  }

  /**
   * Set a file and process it for import
   * 
   * Validates the file, processes its contents, and prepares it for
   * import operations. Updates UI with file information and validation results.
   * 
   * @param {File} file - The file to set and process
   * @returns {Promise<Object>} Promise that resolves with processing result
   */
  async setFile(file, operationType = 'import') {
    try {
      this.logger.info('Setting file', {
        fileName: file.name,
        fileSize: file.size,
        operationType
      });

      // Store the current file reference for later use
      this.currentFile = file;

      // Process the file using the existing internal method
      // This includes validation, parsing, and UI updates
      await this._handleFileInternal(file, null, operationType);
      return {
        success: true,
        file
      };
    } catch (error) {
      this.logger.error('Failed to set file', {
        error: error.message,
        fileName: file.name,
        operationType
      });
      throw error;
    }
  }

  /**
   * Get the list of parsed users from the current file
   * 
   * Returns the array of user objects that were successfully parsed
   * from the CSV file. Each user object contains validated data.
   * 
   * @returns {Array} Array of user objects with validated data
   */
  getUsers() {
    return this.lastParsedUsers || [];
  }

  /**
   * Get the total number of users parsed from the CSV file
   * 
   * Returns the total count of users found in the processed CSV file.
   * This count includes all rows, regardless of validation status.
   * 
   * @returns {number} Total number of users in the CSV file
   */
  getTotalUsers() {
    const totalUsers = this.validationResults.total || 0;
    console.log('[CSV] getTotalUsers() called, returning:', totalUsers, 'validationResults:', this.validationResults);
    return totalUsers;
  }

  /**
   * Read file as text using FileReader API
   * 
   * Asynchronously reads a file and returns its contents as a string.
   * Used for processing CSV files and other text-based formats.
   * 
   * @param {File} file - The file to read
   * @returns {Promise<string>} Promise that resolves with file content as string
   */
  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = event => resolve(event.target.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Save the last folder path that was used
   * @param {File} file - The selected file
   * @param {string} operationType - The operation type ('import', 'delete', 'modify')
   */
  saveLastFolderPath(file, operationType = 'import') {
    try {
      let folderPath = null;

      // Try to extract folder path from different sources
      if (file.webkitRelativePath) {
        // For webkitRelativePath, get the directory part
        const pathParts = file.webkitRelativePath.split('/');
        if (pathParts.length > 1) {
          folderPath = pathParts.slice(0, -1).join('/');
        }
      } else if (file.name) {
        // For regular files, try to extract from the file name
        // This is a fallback since we can't get the full path due to security restrictions
        const fileName = file.name;
        const lastSlashIndex = fileName.lastIndexOf('/');
        if (lastSlashIndex !== -1) {
          folderPath = fileName.substring(0, lastSlashIndex);
        }
      }
      if (folderPath) {
        // Save with operation-specific key
        const storageKey = `lastFolderPath_${operationType}`;
        localStorage.setItem(storageKey, folderPath);
        this.logger.info(`Saved last folder path for ${operationType}:`, folderPath);
      }

      // Also save a general last folder path
      if (folderPath) {
        localStorage.setItem('lastFolderPath', folderPath);
      }
    } catch (error) {
      this.logger.warn('Could not save folder path:', error.message);
    }
  }

  /**
   * Get the last folder path that was used
   * @param {string} operationType - The operation type ('import', 'delete', 'modify')
   * @returns {string|null} The last folder path or null if not available
   */
  getLastFolderPath(operationType = 'import') {
    try {
      // First try to get operation-specific folder path
      const operationKey = `lastFolderPath_${operationType}`;
      let folderPath = localStorage.getItem(operationKey);

      // Fall back to general last folder path
      if (!folderPath) {
        folderPath = localStorage.getItem('lastFolderPath');
      }
      return folderPath;
    } catch (error) {
      this.logger.warn('Could not get last folder path:', error.message);
      return null;
    }
  }

  /**
   * Update the file input label to show last folder path
   * @param {string} operationType - The operation type ('import', 'delete', 'modify')
   */
  updateFileLabel(operationType = 'import') {
    try {
      // Find the appropriate file label based on operation type
      let fileLabel = null;
      let fileInput = null;
      switch (operationType) {
        case 'import':
          fileLabel = _elementRegistry.ElementRegistry.fileInputLabel ? _elementRegistry.ElementRegistry.fileInputLabel() : null;
          fileInput = _elementRegistry.ElementRegistry.fileInput ? _elementRegistry.ElementRegistry.fileInput() : null;
          break;
        case 'delete':
          fileLabel = _elementRegistry.ElementRegistry.deleteFileInputLabel ? _elementRegistry.ElementRegistry.deleteFileInputLabel() : null;
          fileInput = _elementRegistry.ElementRegistry.deleteFileInput ? _elementRegistry.ElementRegistry.deleteFileInput() : null;
          break;
        case 'modify':
          fileLabel = _elementRegistry.ElementRegistry.modifyFileInputLabel ? _elementRegistry.ElementRegistry.modifyFileInputLabel() : null;
          fileInput = _elementRegistry.ElementRegistry.modifyFileInput ? _elementRegistry.ElementRegistry.modifyFileInput() : null;
          break;
        default:
          fileLabel = _elementRegistry.ElementRegistry.fileInputLabel ? _elementRegistry.ElementRegistry.fileInputLabel() : null;
          break;
      }
      if (fileLabel) {
        const lastFolderPath = this.getLastFolderPath(operationType);
        if (lastFolderPath) {
          // Show a shortened version of the path for better UI
          const shortPath = this.shortenPath(lastFolderPath);
          fileLabel.textContent = `Choose CSV File (Last: ${shortPath})`;
          fileLabel.title = `Last used folder: ${lastFolderPath}`;
        } else {
          fileLabel.textContent = 'Choose CSV File';
          fileLabel.title = 'Select a CSV file to process';
        }
      }
    } catch (error) {
      this.logger.warn('Could not update file label:', error.message);
    }
  }

  /**
   * Shorten a file path for display in the UI
   * @param {string} path - The full path
   * @returns {string} The shortened path
   */
  shortenPath(path) {
    if (!path) return '';
    const maxLength = 30;
    if (path.length <= maxLength) {
      return path;
    }

    // Try to keep the most relevant parts
    const parts = path.split('/');
    if (parts.length <= 2) {
      return path.length > maxLength ? '...' + path.slice(-maxLength + 3) : path;
    }

    // Keep first and last parts, add ellipsis in middle
    const firstPart = parts[0];
    const lastPart = parts[parts.length - 1];
    const middleParts = parts.slice(1, -1);
    let result = firstPart;
    if (middleParts.length > 0) {
      result += '/.../' + lastPart;
    } else {
      result += '/' + lastPart;
    }
    return result.length > maxLength ? '...' + result.slice(-maxLength + 3) : result;
  }
  saveFileInfo(fileInfo) {
    try {
      const fileData = {
        name: fileInfo.name,
        size: fileInfo.size,
        lastModified: fileInfo.lastModified,
        type: fileInfo.type
      };
      localStorage.setItem('lastSelectedFile', JSON.stringify(fileData));
      this.lastFileInfo = fileData;
    } catch (error) {
      this.logger.error('Error saving file info:', error);
    }
  }
  clearFileInfo() {
    try {
      localStorage.removeItem('lastSelectedFile');
      this.lastFileInfo = null;
      if (this.fileInfo) {
        this.fileInfo.innerHTML = 'No file selected';
      }
    } catch (error) {
      this.logger.error('Error clearing file info:', error);
    }
  }

  /**
   * Clear the last folder path
   */
  clearLastFolderPath() {
    try {
      localStorage.removeItem('lastFolderPath');
      this.updateFileLabel();
      this.logger.info('Cleared last folder path');
    } catch (error) {
      this.logger.warn('Could not clear last folder path:', error.message);
    }
  }

  // ======================
  // File Handling
  // ======================

  initializeFileInput() {
    if (!this.fileInput) return;

    // Remove existing event listeners
    const newFileInput = this.fileInput.cloneNode(true);
    this.fileInput.parentNode.replaceChild(newFileInput, this.fileInput);
    this.fileInput = newFileInput;

    // Add new event listener
    this.fileInput.addEventListener('change', event => this.handleFileSelect(event));

    // Update file label to show last folder path if available
    this.updateFileLabel();
  }

  /**
   * Handle a File object directly (not an event)
   * @param {File} file
   */
  async handleFileObject(file) {
    await this._handleFileInternal(file);
  }

  /**
   * Handle file selection from an input event
   * @param {Event} event
   */
  async handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) {
      this.logger.warn('No file selected');
      return;
    }

    // Save the folder path for next time
    this.saveLastFolderPath(file, 'import');
    await this._handleFileInternal(file, event);
  }

  /**
   * Shared internal file handling logic
   * @param {File} file
   * @param {Event} [event]
   * @private
   */
  async _handleFileInternal(file, event, operationType = 'import') {
    console.log('[CSV] _handleFileInternal called with file:', file.name, 'size:', file.size, 'operationType:', operationType);
    try {
      this.logger.info('Processing file', {
        fileName: file.name,
        fileSize: file.size,
        operationType
      });

      // Validate file type - allow files without extensions or with any extension except known bad ones
      const fileName = file.name || '';
      const fileExt = this.getFileExtension(fileName).toLowerCase();
      const knownBadExts = ['exe', 'js', 'png', 'jpg', 'jpeg', 'gif', 'pdf', 'zip', 'tar', 'gz'];
      if (fileExt && knownBadExts.includes(fileExt)) {
        const errorMsg = `Unsupported file type: ${fileExt}. Please upload a CSV or text file.`;
        this.logger.error(errorMsg, {
          fileName,
          fileExt
        });
        throw new Error(errorMsg);
      }
      // Accept all other extensions and blank/unknown types (including files with no extension)

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error('File too large. Please select a file smaller than 10MB.');
      }

      // Read file content
      const content = await this.readFileAsText(file);
      console.log('[CSV] _handleFileInternal: About to parse CSV content, length:', content.length);
      // Parse CSV with enhanced validation
      const parseResults = this.parseCSV(content);
      console.log('[CSV] _handleFileInternal: parseCSV completed, parseResults:', parseResults);

      // Store parsed users
      this.parsedUsers = parseResults.users;
      this.lastParsedUsers = [...parseResults.users];

      // Update validation results for getTotalUsers() method
      this.validationResults = {
        total: parseResults.users.length,
        valid: parseResults.validUsers || parseResults.users.length,
        errors: parseResults.errors.length,
        warnings: parseResults.warnings.length
      };

      // Add debug logging
      console.log('[CSV] File parsed successfully:', {
        totalUsers: this.validationResults.total,
        validUsers: this.validationResults.valid,
        errors: this.validationResults.errors,
        warnings: this.validationResults.warnings
      });

      // Update UI with results
      const message = `File processed: ${parseResults.validUsers} valid users, ${parseResults.invalidRows} invalid rows`;
      this.uiManager.showNotification(message, parseResults.invalidRows > 0 ? 'warning' : 'success');

      // Update UI with enhanced file info display based on operation type
      const fileInfoContainerId = operationType === 'modify' ? 'modify-file-info' : 'file-info';
      this.updateFileInfoForElement(file, fileInfoContainerId, parseResults.validUsers);

      // Update file label to show last folder path
      this.updateFileLabel(operationType);

      // Log detailed errors for debugging
      if (parseResults.errors.length > 0) {
        this.logger.warn('CSV parsing errors', {
          errorCount: parseResults.errors.length,
          errors: parseResults.errors.slice(0, 10) // Log first 10 errors
        });
      }

      // Update button state based on operation type
      if (window.app) {
        if (operationType === 'modify' && window.app.updateModifyButtonState) {
          window.app.updateModifyButtonState();
        } else if (operationType === 'import' && window.app.updateImportButtonState) {
          window.app.updateImportButtonState();
        }
      }
    } catch (error) {
      this.logger.error('Failed to process CSV file', {
        error: error.message,
        fileName: file.name,
        operationType
      });
      console.error('Error in _handleFileInternal:', error);
      let errorMessage = 'Failed to process CSV file. ';
      if (error.message.includes('Missing required headers')) {
        errorMessage += error.message;
      } else if (error.message.includes('Invalid file type')) {
        errorMessage += 'Please select a valid CSV file.';
      } else if (error.message.includes('File too large')) {
        errorMessage += 'Please select a smaller file (max 10MB).';
      } else {
        errorMessage += error.message;
      }
      this.uiManager.showNotification(errorMessage, 'error');

      // Clear file input
      if (event && event.target && event.target.value) {
        event.target.value = '';
      }
    }
  }

  /**
   * Process a CSV file for user import
   * 
   * Validates the file format, reads its contents, parses CSV data,
   * and prepares user objects for import. Handles file validation,
   * CSV parsing, and error reporting.
   * 
   * @param {File} file - The CSV file to process
   * @returns {Promise<Object>} Promise that resolves with parsing results
   */
  async processCSV(file) {
    // Log file object for debugging
    this.logger.log('Processing file object:', 'debug', file);

    // Validate file exists and is not empty
    if (!file) {
      this.logger.error('No file provided to processCSV');
      throw new Error('No file selected');
    }
    if (file.size === 0) {
      this.logger.error('Empty file provided', {
        fileName: file.name,
        size: file.size
      });
      throw new Error('File is empty');
    }

    // Only block known bad extensions, allow all others
    const fileName = file.name || '';
    const fileExt = this.getFileExtension(fileName).toLowerCase();
    const knownBadExts = ['exe', 'js', 'png', 'jpg', 'jpeg', 'gif', 'pdf', 'zip', 'tar', 'gz'];
    if (fileExt && knownBadExts.includes(fileExt)) {
      const errorMsg = `Unsupported file type: ${fileExt}. Please upload a CSV or text file.`;
      this.logger.error(errorMsg, {
        fileName,
        fileExt
      });
      throw new Error(errorMsg);
    }
    // Accept all other extensions and blank/unknown types
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error(`File is too large. Maximum size is ${this.formatFileSize(maxSize)}`);
    }

    // Update UI
    this.saveFileInfo(file);
    this.updateFileInfo(file);

    // Store the current file reference
    this.currentFile = file;
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = event => {
        try {
          const text = event.target.result;
          if (!text || text.trim() === '') {
            throw new Error('File is empty or contains no text');
          }
          console.log('[CSV] About to parse CSV text, length:', text.length);
          const {
            headers,
            rows
          } = this.parseCSV(text);
          console.log('[CSV] parseCSV completed, headers:', headers, 'rows count:', rows.length);

          // Validate required fields
          const missingHeaders = this.requiredFields.filter(field => !headers.includes(field));
          if (missingHeaders.length > 0) {
            throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
          }

          // Convert rows to user objects and store them
          this.lastParsedUsers = rows.map(row => {
            const user = {};
            headers.forEach((header, index) => {
              user[header] = row[header] || '';
            });
            return user;
          });

          // Also store in parsedUsers for compatibility with getParsedUsers
          this.parsedUsers = this.lastParsedUsers;

          // Update validation results for getTotalUsers() method
          this.validationResults = {
            total: this.lastParsedUsers.length,
            valid: this.lastParsedUsers.length,
            errors: 0,
            warnings: 0
          };

          // Add debug logging
          console.log('[CSV] File parsed successfully (processCSV):', {
            totalUsers: this.validationResults.total,
            validUsers: this.validationResults.valid,
            errors: this.validationResults.errors,
            warnings: this.validationResults.warnings
          });
          resolve({
            success: true,
            headers,
            rows: this.lastParsedUsers,
            userCount: this.lastParsedUsers.length
          });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      reader.readAsText(file);
    });
  }

  // ======================
  // CSV Parsing Methods
  // ======================

  /**
   * Parse CSV content into headers and data rows
   * 
   * Splits CSV content into lines, extracts headers, and validates
   * required and recommended columns. Handles header mapping for
   * different naming conventions.
   * 
   * @param {string} content - Raw CSV content as string
   * @returns {Object} Object containing headers and parsed rows
   */
  parseCSV(content) {
    // Split content into lines and filter out empty lines
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row');
    }

    // Parse headers from first line
    const headers = this.parseCSVLine(lines[0]);

    // Define required and recommended headers for validation
    const requiredHeaders = ['username'];
    const recommendedHeaders = ['firstName', 'lastName', 'email'];

    // Log all headers for debugging
    console.log('[CSV] All headers:', headers);
    console.log('[CSV] Required headers:', requiredHeaders);
    console.log('[CSV] Recommended headers:', recommendedHeaders);

    // Validate headers
    const missingRequired = requiredHeaders.filter(h => {
      const hasHeader = headers.some(header => {
        const headerLower = header.toLowerCase();
        const mappedHeader = this.getHeaderMapping(headerLower);
        const matches = headerLower === h.toLowerCase() || mappedHeader === h;
        console.log(`[CSV] Checking header "${header}" (${headerLower}) -> "${mappedHeader}" for required "${h}": ${matches}`);
        return matches;
      });
      console.log(`[CSV] Required header "${h}" found: ${hasHeader}`);
      return !hasHeader;
    });
    const missingRecommended = recommendedHeaders.filter(h => {
      const hasHeader = headers.some(header => {
        const headerLower = header.toLowerCase();
        const mappedHeader = this.getHeaderMapping(headerLower);
        const matches = headerLower === h.toLowerCase() || mappedHeader === h;
        console.log(`[CSV] Checking header "${header}" (${headerLower}) -> "${mappedHeader}" for recommended "${h}": ${matches}`);
        return matches;
      });
      console.log(`[CSV] Recommended header "${h}" found: ${hasHeader}`);
      return !hasHeader;
    });
    if (missingRequired.length > 0) {
      const errorMsg = `Missing required headers: ${missingRequired.join(', ')}. At minimum, you need a 'username' column.`;
      this.logger.error('CSV validation failed - missing required headers', {
        missingRequired,
        availableHeaders: headers,
        errorMsg
      });
      throw new Error(errorMsg);
    }
    if (missingRecommended.length > 0) {
      const warningMsg = `Missing recommended headers: ${missingRecommended.join(', ')}. These are not required but recommended for better user data.`;
      this.logger.warn('CSV validation warning - missing recommended headers', {
        missingRecommended,
        availableHeaders: headers,
        warningMsg
      });
      // Show warning but don't throw error
      if (window.app && window.app.uiManager) {
        window.app.uiManager.showNotification(warningMsg, 'warning');
      }
    }
    const users = [];
    const errors = [];
    const warnings = [];
    let rowNumber = 1; // Start from 1 since 0 is header

    for (let i = 1; i < lines.length; i++) {
      rowNumber = i + 1; // +1 because we start from header row
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines

      try {
        const user = this.parseUserRow(line, headers, rowNumber);

        // Validate user data
        const validationResult = this.validateUserData(user, rowNumber);
        if (validationResult.isValid) {
          users.push(user);
        } else {
          errors.push({
            row: rowNumber,
            user: user,
            errors: validationResult.errors,
            warnings: validationResult.warnings
          });

          // Add warnings to warnings array
          warnings.push(...validationResult.warnings.map(w => ({
            row: rowNumber,
            ...w
          })));
        }
      } catch (error) {
        errors.push({
          row: rowNumber,
          error: error.message,
          line: line
        });
      }
    }

    // Log comprehensive validation results
    const validationSummary = {
      totalRows: lines.length - 1,
      validUsers: users.length,
      invalidRows: errors.length,
      warnings: warnings.length,
      missingRequiredHeaders: missingRequired,
      missingRecommendedHeaders: missingRecommended,
      availableHeaders: headers
    };
    this.logger.info('CSV parsing completed', validationSummary);
    if (errors.length > 0) {
      const errorDetails = errors.map(e => ({
        row: e.row,
        errors: e.errors || [e.error],
        warnings: e.warnings || []
      }));
      this.logger.warn('CSV validation issues found', {
        totalErrors: errors.length,
        errorDetails: errorDetails.slice(0, 10) // Log first 10 errors
      });
    }

    // Show user-friendly summary
    this.showValidationSummary(validationSummary, errors, warnings);
    return {
      users,
      errors,
      warnings,
      totalRows: lines.length - 1,
      validUsers: users.length,
      invalidRows: errors.length,
      headerCount: headers.length,
      availableHeaders: headers
    };
  }

  /**
   * Parse a single CSV line
   * @param {string} line - CSV line to parse
   * @param {string} delimiter - Delimiter character
   * @returns {Array<string>} Array of field values
   */
  parseCSVLine(line, delimiter = ',') {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      if (char === '"') {
        if (nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result.map(field => field.trim());
  }

  /**
   * Parse a user row from CSV
   * @param {string} line - CSV line to parse
   * @param {Array<string>} headers - Header row
   * @param {number} rowNumber - Row number for error reporting
   * @returns {Object} Parsed user object
   */
  parseUserRow(line, headers, rowNumber) {
    const values = this.parseCSVLine(line);
    if (values.length !== headers.length) {
      throw new Error(`Row ${rowNumber}: Number of columns (${values.length}) doesn't match headers (${headers.length})`);
    }
    const user = {};
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i].toLowerCase().trim();
      let value = values[i].trim();

      // Handle boolean values
      if (header === 'enabled') {
        const valueLower = value.toLowerCase();
        if (valueLower === 'true' || value === '1') {
          value = true;
        } else if (valueLower === 'false' || value === '0') {
          value = false;
        } else if (value === '') {
          value = true; // Default to enabled
        } else {
          throw new Error(`Row ${rowNumber}: Invalid enabled value '${value}'. Must be true/false or 1/0`);
        }
      }

      // Map common header variations
      const mappedHeader = this.getHeaderMapping(header);
      console.log(`[CSV] Mapping header: "${header}" -> "${mappedHeader}"`);
      user[mappedHeader] = value;
    }

    // Set default username if not provided
    if (!user.username && user.email) {
      user.username = user.email;
    }
    return user;
  }

  /**
   * Validate user data for a specific row
   * @param {Object} user - User object to validate
   * @param {number} rowNumber - Row number for error reporting
   * @returns {Object} Validation result with isValid, errors, and warnings
   */
  validateUserData(user, rowNumber) {
    const errors = [];
    const warnings = [];

    // Check required fields
    if (!user.username || user.username.trim() === '') {
      errors.push('Username is required and cannot be empty');
    }

    // Check recommended fields
    if (!user.firstName || user.firstName.trim() === '') {
      warnings.push('firstName is recommended for better user data');
    }
    if (!user.lastName || user.lastName.trim() === '') {
      warnings.push('lastName is recommended for better user data');
    }
    if (!user.email || user.email.trim() === '') {
      warnings.push('email is recommended for better user data');
    }

    // Validate email format if provided
    if (user.email && user.email.trim() !== '' && !this.isValidEmail(user.email)) {
      errors.push('Invalid email format');
    }

    // Validate username format if provided
    if (user.username && !this.isValidUsername(user.username)) {
      errors.push('Username contains invalid characters (no spaces or special characters allowed)');
    }
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Show validation summary to user
   * @param {Object} summary - Validation summary
   * @param {Array} errors - Array of errors
   * @param {Array} warnings - Array of warnings
   */
  showValidationSummary(summary, errors, warnings) {
    let message = '';
    let type = 'success';
    if (summary.invalidRows > 0) {
      type = 'error';
      message = `File validation failed!\n\n`;
      message += `• Total rows: ${summary.totalRows}\n`;
      message += `• Valid users: ${summary.validUsers}\n`;
      message += `• Invalid rows: ${summary.invalidRows}\n`;
      message += `• Warnings: ${warnings.length}\n\n`;
      if (summary.missingRequiredHeaders.length > 0) {
        message += `❌ Missing required headers: ${summary.missingRequiredHeaders.join(', ')}\n`;
      }
      if (errors.length > 0) {
        message += `❌ Data errors found in ${errors.length} row(s)\n`;
        // Show first few specific errors
        const firstErrors = errors.slice(0, 3);
        firstErrors.forEach(error => {
          if (error.errors) {
            message += `  Row ${error.row}: ${error.errors.join(', ')}\n`;
          } else if (error.error) {
            message += `  Row ${error.row}: ${error.error}\n`;
          }
        });
        if (errors.length > 3) {
          message += `  ... and ${errors.length - 3} more errors\n`;
        }
      }
    } else if (warnings.length > 0) {
      type = 'warning';
      message = `File loaded with warnings:\n\n`;
      message += `• Total rows: ${summary.totalRows}\n`;
      message += `• Valid users: ${summary.validUsers}\n`;
      message += `• Warnings: ${warnings.length}\n\n`;
      if (summary.missingRecommendedHeaders.length > 0) {
        message += `⚠️ Missing recommended headers: ${summary.missingRecommendedHeaders.join(', ')}\n`;
      }

      // Show first few warnings
      const firstWarnings = warnings.slice(0, 3);
      firstWarnings.forEach(warning => {
        message += `  Row ${warning.row}: ${warning.message || warning}\n`;
      });
      if (warnings.length > 3) {
        message += `  ... and ${warnings.length - 3} more warnings\n`;
      }
    } else {
      message = `File loaded successfully!\n\n`;
      message += `• Total rows: ${summary.totalRows}\n`;
      message += `• Valid users: ${summary.validUsers}\n`;
      message += `• Headers found: ${summary.availableHeaders.join(', ')}`;
    }

    // Show notification to user
    if (window.app && window.app.uiManager) {
      window.app.uiManager.showNotification(message, type);
    }

    // Log to server
    this.logger.info('CSV validation summary shown to user', {
      summary,
      message,
      type
    });
  }

  /**
   * Get header mapping for common variations
   * @param {string} header - Header to map
   * @returns {string} Mapped header name
   */
  getHeaderMapping(header) {
    const headerMap = {
      'firstname': 'firstName',
      'first_name': 'firstName',
      'givenname': 'firstName',
      'given_name': 'firstName',
      'lastname': 'lastName',
      'last_name': 'lastName',
      'familyname': 'lastName',
      'family_name': 'lastName',
      'surname': 'lastName',
      'emailaddress': 'email',
      'email_address': 'email',
      'userid': 'username',
      'user_id': 'username',
      'login': 'username',
      'user': 'username',
      'populationid': 'populationId',
      'population_id': 'populationId',
      'popid': 'populationId',
      'pop_id': 'populationId'
    };
    return headerMap[header] || header;
  }

  /**
   * Check if email is valid
   * @param {string} email - Email to validate
   * @returns {boolean} True if valid
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check if username is valid
   * @param {string} username - Username to validate
   * @returns {boolean} True if valid
   */
  isValidUsername(username) {
    // Username should not contain spaces or special characters
    const usernameRegex = /^[a-zA-Z0-9._-]+$/;
    return usernameRegex.test(username);
  }

  // ======================
  // UI Updates
  // ======================

  /**
   * Update file info for any file info container element
   * @param {File} file - The file object
   * @param {string} containerId - The ID of the container element to update
   */
  updateFileInfoForElement(file, containerId, recordCount = null) {
    const container = document.getElementById(containerId);
    console.log('updateFileInfoForElement called:', {
      containerId,
      container: !!container,
      file: !!file,
      recordCount
    });
    if (!container || !file) {
      console.warn('updateFileInfoForElement: container or file is null', {
        containerId,
        hasContainer: !!container,
        hasFile: !!file
      });
      return;
    }
    const fileSize = this.formatFileSize(file.size);
    const lastModified = new Date(file.lastModified).toLocaleString();
    const fileType = file.type || this.getFileExtension(file.name);
    const fileExtension = this.getFileExtension(file.name);

    // Get file path information (if available)
    let filePath = 'Unknown';
    if (file.webkitRelativePath) {
      filePath = file.webkitRelativePath;
    } else if (file.name) {
      // Try to extract directory from file name if it contains path separators
      const pathParts = file.name.split(/[\/\\]/);
      if (pathParts.length > 1) {
        filePath = pathParts.slice(0, -1).join('/');
      } else {
        filePath = 'Current Directory';
      }
    }

    // Calculate additional file properties
    const isCSV = fileExtension === 'csv';
    const isText = fileExtension === 'txt';
    const isValidType = isCSV || isText || fileType === 'text/csv' || fileType === 'text/plain';
    const fileSizeInKB = Math.round(file.size / 1024);
    const fileSizeInMB = Math.round(file.size / 1024 / 1024 * 100) / 100;

    // Determine record count display
    let recordCountHTML = '';
    if (isValidType && recordCount !== null) {
      if (typeof recordCount === 'number') {
        if (recordCount > 0) {
          recordCountHTML = `<div class="file-info-item" style="background: white; padding: 8px; border-radius: 4px; border: 1px solid #e9ecef;"><strong style="color: #495057; display: block; margin-bottom: 3px; font-size: 0.85rem;">🧾 Records</strong><span style="color: #0073C8; font-size: 0.8rem; font-weight: bold;">${recordCount}</span></div>`;
        } else {
          recordCountHTML = `<div class="file-info-item" style="background: white; padding: 8px; border-radius: 4px; border: 1px solid #e9ecef;"><strong style="color: #495057; display: block; margin-bottom: 3px; font-size: 0.85rem;">🧾 Records</strong><span style="color: #dc3545; font-size: 0.8rem; font-weight: bold;">No user records found</span></div>`;
        }
      }
    }

    // Create compact file info display with reduced footprint
    const fileInfoHTML = `
            <div class="file-info-details" style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 6px; padding: 12px; margin: 8px 0; box-shadow: 0 1px 4px rgba(0,0,0,0.08);">
                
                <!-- Compact File Name Section -->
                <div class="file-name-section" style="text-align: center; margin-bottom: 12px; padding: 8px; background: #e6f4ff; border-radius: 4px; color: #1a237e; font-weight: bold; font-size: 1.1rem;">
                    <div style="font-size: 1.3rem; font-weight: 600; margin-bottom: 3px; color: #1a237e; text-shadow: none; word-break: break-word; overflow-wrap: break-word;">
                        <i class="fas fa-file-csv" style="margin-right: 6px; font-size: 1.2rem; color: #1976d2;"></i>
                        ${file.name}
                    </div>
                    <div style="font-size: 0.85rem; opacity: 0.9; font-weight: 500; color: #1976d2;">
                        File Selected Successfully
                    </div>
                </div>
                
                <!-- Compact File Information Grid -->
                <div class="file-info-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; font-size: 0.8em; margin-bottom: 10px;">
                    <div class="file-info-item" style="background: white; padding: 8px; border-radius: 4px; border: 1px solid #e9ecef;">
                        <strong style="color: #495057; display: block; margin-bottom: 3px; font-size: 0.85rem;">📊 File Size</strong>
                        <span style="color: #6c757d; font-size: 0.8rem;">${fileSize} (${fileSizeInKB} KB, ${fileSizeInMB} MB)</span>
                    </div>
                    
                    <div class="file-info-item" style="background: white; padding: 8px; border-radius: 4px; border: 1px solid #e9ecef;">
                        <strong style="color: #495057; display: block; margin-bottom: 3px; font-size: 0.85rem;">📂 Directory</strong>
                        <span style="color: #6c757d; word-break: break-all; font-size: 0.8rem;">${filePath}</span>
                    </div>
                    
                    <div class="file-info-item" style="background: white; padding: 8px; border-radius: 4px; border: 1px solid #e9ecef;">
                        <strong style="color: #495057; display: block; margin-bottom: 3px; font-size: 0.85rem;">📅 Last Modified</strong>
                        <span style="color: #6c757d; font-size: 0.8rem;">${lastModified}</span>
                    </div>
                    
                    <div class="file-info-item" style="background: white; padding: 8px; border-radius: 4px; border: 1px solid #e9ecef;">
                        <strong style="color: #495057; display: block; margin-bottom: 3px; font-size: 0.85rem;">🔤 File Type</strong>
                        <span style="color: #6c757d; font-size: 0.8rem;">${fileType || 'Unknown'}</span>
                    </div>
                    
                    <div class="file-info-item" style="background: white; padding: 8px; border-radius: 4px; border: 1px solid #e9ecef;">
                        <strong style="color: #495057; display: block; margin-bottom: 3px; font-size: 0.85rem;">📄 Extension</strong>
                        <span style="color: ${isValidType ? '#28a745' : '#dc3545'}; font-weight: bold; font-size: 0.8rem;">
                            ${fileExtension ? '.' + fileExtension : 'None'}
                        </span>
                    </div>
                    ${recordCountHTML}
                </div>
                
                <!-- Compact File Status Section -->
                <div class="file-info-status" style="margin-top: 8px; padding: 8px; border-radius: 4px; background: ${isValidType ? '#d4edda' : '#f8d7da'}; border: 1px solid ${isValidType ? '#c3e6cb' : '#f5c6cb'}; display: flex; align-items: center; gap: 6px;">
                    <i class="fas ${isValidType ? 'fa-check-circle' : 'fa-exclamation-triangle'}" style="color: ${isValidType ? '#155724' : '#721c24'}; font-size: 1rem;"></i>
                    <span style="color: ${isValidType ? '#155724' : '#721c24'}; font-weight: bold; font-size: 0.85rem;">
                        ${isValidType ? '✅ File type is supported and ready for processing' : '⚠️ Warning: File type may not be optimal for import'}
                    </span>
                </div>
                
                ${file.size > 5 * 1024 * 1024 ? `
                <div class="file-info-warning" style="margin-top: 8px; padding: 8px; border-radius: 4px; background: #fff3cd; border: 1px solid #ffeaa7; display: flex; align-items: center; gap: 6px;">
                    <i class="fas fa-exclamation-triangle" style="color: #856404; font-size: 1rem;"></i>
                    <span style="color: #856404; font-weight: bold; font-size: 0.85rem;">Large file detected - processing may take longer than usual</span>
                </div>
                ` : ''}
                
                <!-- Responsive Design -->
                <style>
                    @media (max-width: 768px) {
                        .file-info-details .file-name-section div:first-child {
                            font-size: 1.1rem !important;
                        }
                        .file-info-grid {
                            grid-template-columns: 1fr !important;
                            gap: 6px !important;
                        }
                        .file-info-item {
                            padding: 6px !important;
                        }
                    }
                    @media (max-width: 480px) {
                        .file-info-details .file-name-section div:first-child {
                            font-size: 0.95rem !important;
                        }
                        .file-info-details {
                            padding: 8px !important;
                        }
                    }
                </style>
            </div>
        `;
    container.innerHTML = fileInfoHTML;
  }
  updateFileInfo(file, recordCount = null) {
    this.updateFileInfoForElement(file, 'file-info', recordCount);
  }
  showPreview(rows) {
    if (!this.previewContainer) return;
    if (!rows || rows.length === 0) {
      this.previewContainer.innerHTML = '<div class="alert alert-info">No data to display</div>';
      // Disable import button if no rows
      const importBtnBottom = _elementRegistry.ElementRegistry.startImportBtnBottom ? _elementRegistry.ElementRegistry.startImportBtnBottom() : null;
      if (importBtnBottom) {
        importBtnBottom.disabled = true;
      }
      return;
    }
    const headers = Object.keys(rows[0]);
    const previewRows = rows.slice(0, 5); // Show first 5 rows

    let html = `
            <div class="table-responsive">
                <table class="table table-sm table-striped">
                    <thead>
                        <tr>
                            ${headers.map(h => `<th>${h}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${previewRows.map(row => `
                            <tr>
                                ${headers.map(h => `<td>${row[h] || ''}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                ${rows.length > 5 ? `<small class="text-muted">Showing 5 of ${rows.length} rows</small>` : ''}
            </div>
        `;
    this.previewContainer.innerHTML = html;

    // Check if population choice has been made
    const hasPopulationChoice = this.checkPopulationChoice();

    // Enable import button after showing preview (only if population choice is made)
    const importBtnBottom = _elementRegistry.ElementRegistry.startImportBtnBottom ? _elementRegistry.ElementRegistry.startImportBtnBottom() : null;
    if (importBtnBottom) {
      importBtnBottom.disabled = !hasPopulationChoice;
      this.logger.log(`Import button ${hasPopulationChoice ? 'enabled' : 'disabled'}`, 'debug');
    } else {
      this.logger.warn('Could not find import button to enable', 'warn');
    }
  }

  /**
   * Check if user has made a population choice
   * @returns {boolean} True if a population choice has been made
   */
  checkPopulationChoice() {
    const selectedPopulationId = _elementRegistry.ElementRegistry.importPopulationSelect ? _elementRegistry.ElementRegistry.importPopulationSelect().value || '' : '';
    const useDefaultPopulation = _elementRegistry.ElementRegistry.useDefaultPopulationCheckbox ? _elementRegistry.ElementRegistry.useDefaultPopulationCheckbox().checked || false : false;
    const useCsvPopulationId = _elementRegistry.ElementRegistry.useCsvPopulationIdCheckbox ? _elementRegistry.ElementRegistry.useCsvPopulationIdCheckbox().checked || false : false;
    const hasSelectedPopulation = selectedPopulationId && selectedPopulationId.trim() !== '';
    return hasSelectedPopulation || useDefaultPopulation || useCsvPopulationId;
  }

  // ======================
  // Utility Methods
  // ======================

  getFileExtension(filename) {
    if (!filename || typeof filename !== 'string') return '';

    // Handle cases where filename might be a path
    const lastDot = filename.lastIndexOf('.');
    const lastSlash = Math.max(filename.lastIndexOf('/'), filename.lastIndexOf('\\'));

    // If there's no dot, or the dot is before the last slash, return empty string
    if (lastDot === -1 || lastSlash > lastDot) return '';

    // Extract and return the extension (without the dot)
    return filename.slice(lastDot + 1).toLowerCase().trim();
  }
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  generateTemporaryPassword() {
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]\\:;?><,./-';
    let password = '';

    // Ensure at least one of each character type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)];

    // Fill the rest of the password
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Get parsed users for import
   * @returns {Array<Object>} Array of validated user objects
   */
  getParsedUsers() {
    this.logger.info('getParsedUsers called', {
      hasParsedUsers: !!this.parsedUsers,
      parsedUsersType: typeof this.parsedUsers,
      parsedUsersLength: this.parsedUsers ? this.parsedUsers.length : 0,
      hasLastParsedUsers: !!this.lastParsedUsers,
      lastParsedUsersType: typeof this.lastParsedUsers,
      lastParsedUsersLength: this.lastParsedUsers ? this.lastParsedUsers.length : 0
    });
    if (!this.parsedUsers || !Array.isArray(this.parsedUsers)) {
      this.logger.warn('No parsed users available');
      return [];
    }
    this.logger.info('Retrieving parsed users for import', {
      userCount: this.parsedUsers.length,
      hasUsers: this.parsedUsers.length > 0
    });
    return this.parsedUsers;
  }

  /**
   * Get parsing results for debugging
   * @returns {Object|null} Parsing results or null if not available
   */
  getParseResults() {
    return this.parseResults || null;
  }

  /**
   * Initialize drag-and-drop support for a drop zone element
   * @param {HTMLElement} dropZone - The drop zone element
   */
  initializeDropZone(dropZone) {
    if (!dropZone) return;

    // Remove any previous listeners
    dropZone.removeEventListener('dragenter', this._onDragEnter);
    dropZone.removeEventListener('dragover', this._onDragOver);
    dropZone.removeEventListener('dragleave', this._onDragLeave);
    dropZone.removeEventListener('drop', this._onDrop);

    // Bind event handlers to this instance
    this._onDragEnter = e => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('drag-over');
    };
    this._onDragOver = e => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('drag-over');
    };
    this._onDragLeave = e => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('drag-over');
    };
    this._onDrop = async e => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('drag-over');
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        try {
          await this.setFile(files[0]);
        } catch (error) {
          this.logger.error('Drag-and-drop file error', {
            error: error.message
          });
          this.uiManager.showNotification('Failed to process dropped file: ' + error.message, 'error');
        }
      }
    };

    // Attach listeners
    dropZone.addEventListener('dragenter', this._onDragEnter);
    dropZone.addEventListener('dragover', this._onDragOver);
    dropZone.addEventListener('dragleave', this._onDragLeave);
    dropZone.addEventListener('drop', this._onDrop);
  }

  /**
   * Initialize global drag-and-drop prevention and routing
   * This prevents the browser from trying to open files and routes them to the app
   */
  initializeGlobalDragAndDrop() {
    // Prevent browser default behavior for file drops anywhere on the page
    const preventDefaultDragEvents = e => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Handle file drops anywhere on the document
    const handleGlobalDrop = async e => {
      e.preventDefault();
      e.stopPropagation();

      // Remove body drag-over class
      document.body.classList.remove('drag-over');
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];

        // Check if it's a supported file type
        const fileName = file.name || '';
        const fileExt = this.getFileExtension(fileName).toLowerCase();
        const supportedExts = ['csv', 'txt'];
        const knownBadExts = ['exe', 'js', 'png', 'jpg', 'jpeg', 'gif', 'pdf', 'zip', 'tar', 'gz'];
        if (fileExt && knownBadExts.includes(fileExt)) {
          this.uiManager.showNotification(`Unsupported file type: ${fileExt}. Please upload a CSV or text file.`, 'error');
          return;
        }

        // Route to appropriate handler based on current view
        const currentView = this.getCurrentView();
        let targetDropZone = null;
        switch (currentView) {
          case 'import':
            targetDropZone = document.getElementById('import-drop-zone');
            break;
          case 'modify':
            targetDropZone = document.getElementById('modify-drop-zone');
            break;
          case 'import-dashboard':
            targetDropZone = document.getElementById('upload-zone');
            break;
          default:
            // Default to import view if no specific view is active
            targetDropZone = document.getElementById('import-drop-zone');
            break;
        }

        // Show visual feedback on the target drop zone
        if (targetDropZone) {
          targetDropZone.classList.add('drag-over');
          setTimeout(() => {
            targetDropZone.classList.remove('drag-over');
          }, 2000);
        }
        try {
          await this.setFile(file);
          this.uiManager.showNotification(`File "${file.name}" processed successfully`, 'success');
        } catch (error) {
          this.logger.error('Global drag-and-drop file error', {
            error: error.message
          });
          this.uiManager.showNotification('Failed to process dropped file: ' + error.message, 'error');
        }
      }
    };

    // Add visual feedback when dragging files over the document
    const handleGlobalDragEnter = e => {
      e.preventDefault();
      e.stopPropagation();

      // Only add visual feedback if dragging files
      if (e.dataTransfer.types.includes('Files')) {
        document.body.classList.add('drag-over');
      }
    };
    const handleGlobalDragLeave = e => {
      e.preventDefault();
      e.stopPropagation();

      // Only remove visual feedback if leaving the document entirely
      if (e.target === document || e.target === document.body) {
        document.body.classList.remove('drag-over');
      }
    };

    // Add global event listeners
    document.addEventListener('dragover', preventDefaultDragEvents);
    document.addEventListener('dragenter', handleGlobalDragEnter);
    document.addEventListener('dragleave', handleGlobalDragLeave);
    document.addEventListener('drop', handleGlobalDrop);

    // Store references for cleanup
    this._globalDragHandlers = {
      preventDefaultDragEvents,
      handleGlobalDragEnter,
      handleGlobalDragLeave,
      handleGlobalDrop
    };
    this.logger.info('Global drag-and-drop prevention initialized');
  }

  /**
   * Clean up global drag-and-drop event listeners
   */
  cleanupGlobalDragAndDrop() {
    if (this._globalDragHandlers) {
      document.removeEventListener('dragover', this._globalDragHandlers.preventDefaultDragEvents);
      document.removeEventListener('dragenter', this._globalDragHandlers.handleGlobalDragEnter);
      document.removeEventListener('dragleave', this._globalDragHandlers.handleGlobalDragLeave);
      document.removeEventListener('drop', this._globalDragHandlers.handleGlobalDrop);
      this._globalDragHandlers = null;
    }

    // Remove any remaining visual feedback
    document.body.classList.remove('drag-over');
  }

  /**
   * Get the current active view
   * @returns {string} The current view name
   */
  getCurrentView() {
    const activeView = document.querySelector('.view[style*="block"]') || document.querySelector('.view:not([style*="none"])');
    if (!activeView) return 'import';
    const viewId = activeView.id;
    if (viewId === 'import-dashboard-view') return 'import-dashboard';
    if (viewId === 'modify-csv-view') return 'modify';
    if (viewId === 'delete-csv-view') return 'delete';
    if (viewId === 'export-view') return 'export';
    if (viewId === 'settings-view') return 'settings';
    if (viewId === 'logs-view') return 'logs';
    return 'import'; // Default to import view
  }
}
exports.FileHandler = FileHandler;

},{"./element-registry.js":44}],47:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FileLogger = void 0;
/**
 * FileLogger - Handles writing logs to a client.log file using the File System Access API
 */
class FileLogger {
  /**
   * Create a new FileLogger instance
   * @param {string} filename - Name of the log file (default: 'client.log')
   */
  constructor(filename = 'client.log') {
    this.filename = filename;
    this.fileHandle = null;
    this.writableStream = null;
    this.initialized = false;
    this.logQueue = [];
    this.initializationPromise = null;
  }

  /**
   * Initialize the file logger
   * @private
   */
  async _initialize() {
    if (this.initialized) return true;
    if (this.initializationPromise) {
      return this.initializationPromise;
    }
    this.initializationPromise = (async () => {
      try {
        // Check if we're in a secure context and the API is available
        if (!window.isSecureContext || !window.showSaveFilePicker) {
          throw new Error('File System Access API not available in this context');
        }

        // Only proceed if we're handling a user gesture
        if (!window.__fileLoggerUserGesture) {
          // Set up event listeners
          window.addEventListener('online', () => this.handleOnline());
          window.addEventListener('offline', () => this.handleOffline());

          // Set up user gesture detection for file logger
          const handleUserGesture = () => {
            window.__fileLoggerUserGesture = true;
            window.removeEventListener('click', handleUserGesture);
            window.removeEventListener('keydown', handleUserGesture);

            // Try to initialize the file logger if it hasn't been initialized yet
            if (this.fileLogger && !this.fileLogger._initialized && this.fileLogger._logger === null) {
              this.fileLogger._ensureInitialized().catch(console.warn);
            }
          };
          window.addEventListener('click', handleUserGesture, {
            once: true,
            passive: true
          });
          window.addEventListener('keydown', handleUserGesture, {
            once: true,
            passive: true
          });
          throw new Error('Waiting for user gesture to initialize file logger');
        }
        try {
          this.fileHandle = await window.showSaveFilePicker({
            suggestedName: this.filename,
            types: [{
              description: 'Log File',
              accept: {
                'text/plain': ['.log']
              }
            }],
            excludeAcceptAllOption: true
          });
          this.writableStream = await this.fileHandle.createWritable({
            keepExistingData: true
          });
          this.initialized = true;
          await this._processQueue();
          return true;
        } catch (error) {
          console.warn('File System Access API not available:', error);
          this.initialized = false;
          return false;
        }
      } catch (error) {
        console.warn('File logger initialization deferred:', error.message);
        this.initialized = false;
        return false;
      }
    })();
    return this.initializationPromise;
  }

  /**
   * Process any queued log messages
   * @private
   */
  async _processQueue() {
    if (this.logQueue.length === 0) return;
    const queue = [...this.logQueue];
    this.logQueue = [];
    for (const {
      level,
      message,
      timestamp
    } of queue) {
      await this._writeLog(level, message, timestamp);
    }
  }

  /**
   * Write a log message to the file
   * @private
   */
  async _writeLog(level, message, timestamp) {
    if (!this.initialized) {
      await this._initialize();
    }
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
    if (this.writableStream) {
      try {
        await this.writableStream.write(logEntry);
      } catch (error) {
        console.error('Error writing to log file:', error);
        this.initialized = false;
        await this._initialize();
        await this.writableStream.write(logEntry);
      }
    } else {
      console[level](`[FileLogger] ${logEntry}`);
    }
  }

  /**
   * Log a message
   * @param {string} level - Log level (info, warn, error, debug)
   * @param {string} message - The message to log
   */
  async log(level, message) {
    const timestamp = new Date().toISOString();
    if (!this.initialized) {
      this.logQueue.push({
        level,
        message,
        timestamp
      });
      await this._initialize();
    } else {
      await this._writeLog(level, message, timestamp);
    }
  }

  /**
   * Log an info message
   * @param {string} message - The message to log
   */
  info(message) {
    return this.log('info', message);
  }

  /**
   * Log a warning message
   * @param {string} message - The message to log
   */
  warn(message) {
    return this.log('warn', message);
  }

  /**
   * Log an error message
   * @param {string} message - The message to log
   */
  error(message) {
    return this.log('error', message);
  }

  /**
   * Log a debug message
   * @param {string} message - The message to log
   */
  debug(message) {
    return this.log('debug', message);
  }

  /**
   * Close the log file
   */
  async close() {
    if (this.writableStream) {
      try {
        await this.writableStream.close();
      } catch (error) {
        console.error('Error closing log file:', error);
      } finally {
        this.initialized = false;
        this.writableStream = null;
        this.fileHandle = null;
      }
    }
  }
}
exports.FileLogger = FileLogger;

},{}],48:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.historyManager = exports.HistoryManager = void 0;
// HistoryManager: Handles history page functionality including loading, filtering, and displaying operation history
// Provides comprehensive history management with filtering, real-time updates, and expandable details

class HistoryManager {
  constructor() {
    this.historyContainer = null;
    this.refreshButton = null;
    this.clearButton = null;
    this.currentHistory = [];
    this.isAutoRefresh = true;
    this.refreshInterval = null;
    this.filterType = '';
    this.filterPopulation = '';
    this.filterStartDate = '';
    this.filterEndDate = '';
    this.filterText = '';
    this.initialize();
  }
  initialize() {
    this.setupElements();
    this.setupEventListeners();
    this.startAutoRefresh();
    this.loadHistory();
    this.loadPopulations();
  }
  setupElements() {
    this.historyContainer = document.getElementById('history-container');
    this.refreshButton = document.getElementById('refresh-history');
    this.clearButton = document.getElementById('clear-history');
    if (!this.historyContainer) {
      console.warn('History container not found');
      return;
    }
    if (!this.refreshButton) {
      console.warn('Refresh history button not found');
    }
    if (!this.clearButton) {
      console.warn('Clear history button not found');
    }
  }
  setupEventListeners() {
    if (this.refreshButton) {
      this.refreshButton.addEventListener('click', () => this.loadHistory());
    }
    if (this.clearButton) {
      this.clearButton.addEventListener('click', () => this.clearHistory());
    }

    // Setup filter controls
    this.setupFilterControls();

    // Setup search functionality
    this.setupSearchControls();
  }
  setupFilterControls() {
    const typeFilter = document.getElementById('history-type-filter');
    const populationFilter = document.getElementById('history-population-filter');
    const startDateFilter = document.getElementById('history-date-start');
    const endDateFilter = document.getElementById('history-date-end');
    const applyFiltersBtn = document.getElementById('apply-history-filters');
    const clearFiltersBtn = document.getElementById('clear-history-filters');
    if (applyFiltersBtn) {
      applyFiltersBtn.addEventListener('click', () => this.applyFilters());
    }
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', () => this.clearFilters());
    }

    // Auto-apply filters on change
    if (typeFilter) {
      typeFilter.addEventListener('change', () => this.applyFilters());
    }
    if (populationFilter) {
      populationFilter.addEventListener('input', () => this.applyFilters());
    }
    if (startDateFilter) {
      startDateFilter.addEventListener('change', () => this.applyFilters());
    }
    if (endDateFilter) {
      endDateFilter.addEventListener('change', () => this.applyFilters());
    }
  }
  setupSearchControls() {
    const searchIcon = document.getElementById('history-search-icon');
    const searchInput = document.getElementById('history-search-input');
    if (searchIcon && searchInput) {
      searchIcon.addEventListener('click', () => {
        if (searchInput.style.display === 'none') {
          searchInput.style.display = 'inline-block';
          searchInput.focus();
        } else {
          searchInput.value = '';
          searchInput.style.display = 'none';
          this.filterText = '';
          this.applyFilters();
        }
      });
      searchInput.addEventListener('input', e => {
        this.filterText = e.target.value.toLowerCase();
        this.applyFilters();
      });

      // Hide input on Escape
      searchInput.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
          searchInput.value = '';
          searchInput.style.display = 'none';
          this.filterText = '';
          this.applyFilters();
        }
      });
    }
  }
  async loadHistory() {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('limit', '100');
      if (this.filterType) params.append('type', this.filterType);
      if (this.filterPopulation) params.append('population', this.filterPopulation);
      if (this.filterStartDate) params.append('startDate', this.filterStartDate);
      if (this.filterEndDate) params.append('endDate', this.filterEndDate);
      const response = await fetch(`/api/history?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.success && data.operations) {
        this.currentHistory = data.operations;
        this.displayHistory();
        this.scrollToTop();
      } else {
        console.warn('No history received or invalid response format');
        this.displayNoHistory();
      }
    } catch (error) {
      console.error('Failed to load history:', error);
      this.displayError('Failed to load history: ' + error.message);
    }
  }
  displayHistory() {
    if (!this.historyContainer) return;
    this.historyContainer.innerHTML = '';
    if (this.currentHistory.length === 0) {
      this.displayNoHistory();
      return;
    }
    const filteredHistory = this.getFilteredHistory();
    if (filteredHistory.length === 0) {
      this.displayNoFilterResults();
      return;
    }
    filteredHistory.forEach(operation => {
      const historyElement = this.createHistoryElement(operation);
      this.historyContainer.appendChild(historyElement);
    });

    // Update history count
    this.updateHistoryCount(filteredHistory.length, this.currentHistory.length);
  }
  displayNoFilterResults() {
    if (!this.historyContainer) return;
    const hasFilters = this.filterType || this.filterPopulation || this.filterStartDate || this.filterEndDate || this.filterText;
    if (hasFilters) {
      this.historyContainer.innerHTML = `
                <div class="no-history-message">
                    <i class="fas fa-search"></i>
                    <h3>No records found</h3>
                    <p>No operations match the selected filters.</p>
                    <p>Try adjusting your filter criteria or <button class="btn btn-link" onclick="historyManager.clearFilters()">clear all filters</button> to see all records.</p>
                </div>
            `;
    } else {
      this.displayNoHistory();
    }
  }
  getFilteredHistory() {
    return this.currentHistory.filter(operation => {
      // Type filter
      if (this.filterType && operation.type !== this.filterType) {
        return false;
      }

      // Population filter
      if (this.filterPopulation && !operation.population.toLowerCase().includes(this.filterPopulation.toLowerCase())) {
        return false;
      }

      // Date range filters
      if (this.filterStartDate) {
        const operationDate = new Date(operation.timestamp);
        const startDate = new Date(this.filterStartDate);
        if (operationDate < startDate) {
          return false;
        }
      }
      if (this.filterEndDate) {
        const operationDate = new Date(operation.timestamp);
        const endDate = new Date(this.filterEndDate);
        // Set end date to end of day for inclusive filtering
        endDate.setHours(23, 59, 59, 999);
        if (operationDate > endDate) {
          return false;
        }
      }

      // Text search filter
      if (this.filterText) {
        const searchText = `${operation.type} ${operation.fileName} ${operation.population} ${operation.message}`.toLowerCase();
        if (!searchText.includes(this.filterText)) {
          return false;
        }
      }
      return true;
    });
  }
  applyFilters() {
    // Get current filter values
    const typeFilter = document.getElementById('history-type-filter');
    const populationFilter = document.getElementById('history-population-filter');
    const startDateFilter = document.getElementById('history-date-start');
    const endDateFilter = document.getElementById('history-date-end');
    this.filterType = typeFilter ? typeFilter.value : '';
    this.filterPopulation = populationFilter ? populationFilter.value : '';
    this.filterStartDate = startDateFilter ? startDateFilter.value : '';
    this.filterEndDate = endDateFilter ? endDateFilter.value : '';

    // Apply filters to current data (client-side filtering)
    this.displayHistory();
  }
  clearFilters() {
    const typeFilter = document.getElementById('history-type-filter');
    const populationFilter = document.getElementById('history-population-filter');
    const startDateFilter = document.getElementById('history-date-start');
    const endDateFilter = document.getElementById('history-date-end');
    if (typeFilter) typeFilter.value = '';
    if (populationFilter) populationFilter.value = '';
    if (startDateFilter) startDateFilter.value = '';
    if (endDateFilter) endDateFilter.value = '';
    this.filterType = '';
    this.filterPopulation = '';
    this.filterStartDate = '';
    this.filterEndDate = '';
    this.filterText = '';

    // Apply cleared filters to current data (client-side filtering)
    this.displayHistory();
  }
  createHistoryElement(operation) {
    const historyElement = document.createElement('div');
    historyElement.className = `history-entry ${operation.type.toLowerCase()}`;
    historyElement.setAttribute('data-operation-id', operation.id);
    historyElement.setAttribute('tabindex', '0');
    historyElement.setAttribute('role', 'button');
    historyElement.setAttribute('aria-expanded', 'false');
    historyElement.setAttribute('aria-label', `Operation: ${operation.type} - ${operation.fileName}`);
    const timestamp = new Date(operation.timestamp).toLocaleString();
    const typeClass = `operation-type ${operation.type.toLowerCase()}`;

    // Create result summary
    const resultSummary = this.createResultSummary(operation);
    historyElement.innerHTML = `
            <div class="history-header">
                <div class="history-info">
                    <span class="${typeClass}">${operation.type}</span>
                    <span class="history-timestamp">${timestamp}</span>
                </div>
                <div class="history-summary">
                    <span class="history-file">${this.escapeHtml(operation.fileName)}</span>
                    <span class="history-population">${this.escapeHtml(operation.population)}</span>
                    <span class="history-result">${resultSummary}</span>
                </div>
                <span class="history-expand-icon" aria-hidden="true">▶</span>
            </div>
            <div class="history-message">${this.escapeHtml(operation.message)}</div>
            <div class="history-details" role="region" aria-label="Operation details">
                <div class="history-details-content">
                    <div class="history-detail-section">
                        <h5>File Information:</h5>
                        <p><strong>File Name:</strong> ${this.escapeHtml(operation.fileName)}</p>
                        <p><strong>Population:</strong> ${this.escapeHtml(operation.population)}</p>
                        <p><strong>Environment ID:</strong> ${this.escapeHtml(operation.environmentId)}</p>
                    </div>
                    
                    <div class="history-detail-section">
                        <h5>Operation Details:</h5>
                        ${this.createOperationDetails(operation)}
                    </div>
                    
                    ${operation.ip ? `
                        <div class="history-detail-section">
                            <h5>Connection Info:</h5>
                            <p><strong>IP Address:</strong> ${operation.ip}</p>
                            ${operation.userAgent ? `<p><strong>User Agent:</strong> ${this.escapeHtml(operation.userAgent)}</p>` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

    // Enhanced click handler for expand/collapse
    const handleToggle = event => {
      event.preventDefault();
      event.stopPropagation();
      const isExpanded = historyElement.classList.contains('expanded');
      const expandIcon = historyElement.querySelector('.history-expand-icon');
      const details = historyElement.querySelector('.history-details');
      if (isExpanded) {
        // Collapse
        historyElement.classList.remove('expanded');
        historyElement.setAttribute('aria-expanded', 'false');
        if (expandIcon) {
          expandIcon.textContent = '▶';
          expandIcon.setAttribute('aria-label', 'Expand operation details');
        }
        if (details) {
          details.style.display = 'none';
        }
      } else {
        // Expand
        historyElement.classList.add('expanded');
        historyElement.setAttribute('aria-expanded', 'true');
        if (expandIcon) {
          expandIcon.textContent = '▼';
          expandIcon.setAttribute('aria-label', 'Collapse operation details');
        }
        if (details) {
          details.style.display = 'block';
          // Smooth scroll into view if needed
          setTimeout(() => {
            if (details.getBoundingClientRect().bottom > window.innerHeight) {
              details.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
              });
            }
          }, 100);
        }
      }
    };

    // Click handler
    historyElement.addEventListener('click', handleToggle);

    // Keyboard accessibility
    historyElement.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleToggle(event);
      }
    });

    // Focus management
    historyElement.addEventListener('focus', () => {
      historyElement.classList.add('focused');
    });
    historyElement.addEventListener('blur', () => {
      historyElement.classList.remove('focused');
    });
    return historyElement;
  }
  createResultSummary(operation) {
    switch (operation.type) {
      case 'IMPORT':
      case 'MODIFY':
        return `✔️ ${operation.success || 0} Success / ❌ ${operation.errors || 0} Errors / ⚠️ ${operation.skipped || 0} Skipped`;
      case 'EXPORT':
        return `📊 ${operation.recordCount || 0} Records / 📁 ${operation.format || 'CSV'}`;
      case 'DELETE':
        return `🗑️ ${operation.deleteCount || 0} Deleted / 📋 ${operation.total || 0} Total`;
      default:
        return '📋 Operation completed';
    }
  }
  createOperationDetails(operation) {
    switch (operation.type) {
      case 'IMPORT':
      case 'MODIFY':
        return `
                    <p><strong>Total Processed:</strong> ${operation.total || 0}</p>
                    <p><strong>Successfully Processed:</strong> ${operation.success || 0}</p>
                    <p><strong>Errors:</strong> ${operation.errors || 0}</p>
                    <p><strong>Skipped:</strong> ${operation.skipped || 0}</p>
                `;
      case 'EXPORT':
        return `
                    <p><strong>Record Count:</strong> ${operation.recordCount || 0}</p>
                    <p><strong>Format:</strong> ${operation.format || 'CSV'}</p>
                    <p><strong>File Size:</strong> ${operation.fileSize || 'Unknown'}</p>
                `;
      case 'DELETE':
        return `
                    <p><strong>Delete Type:</strong> ${operation.deleteType || 'file'}</p>
                    <p><strong>Total Users:</strong> ${operation.total || 0}</p>
                    <p><strong>Successfully Deleted:</strong> ${operation.deleteCount || 0}</p>
                `;
      default:
        return '<p>No additional details available</p>';
    }
  }
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  displayNoHistory() {
    if (!this.historyContainer) return;
    this.historyContainer.innerHTML = `
            <div class="no-history-message">
                <i class="fas fa-info-circle"></i>
                <p>No operation history found.</p>
                <small>History will appear here when operations are performed</small>
            </div>
        `;
  }
  displayError(message) {
    if (!this.historyContainer) return;
    this.historyContainer.innerHTML = `
            <div class="history-error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${this.escapeHtml(message)}</p>
                <button class="btn btn-secondary" onclick="window.historyManager.loadHistory()">
                    <i class="fas fa-sync-alt"></i> Retry
                </button>
            </div>
        `;
  }
  updateHistoryCount(filtered, total) {
    const historyHeader = document.querySelector('.history-header h1');
    if (historyHeader) {
      if (filtered === total) {
        historyHeader.textContent = `Operation History (${total})`;
      } else {
        historyHeader.textContent = `Operation History (${filtered}/${total})`;
      }
    }
  }
  scrollToTop() {
    if (this.historyContainer) {
      this.historyContainer.scrollTop = 0;
    }
  }
  async clearHistory() {
    if (!confirm('Are you sure you want to clear all operation history? This action cannot be undone.')) {
      return;
    }
    try {
      const response = await fetch('/api/logs/ui', {
        method: 'DELETE'
      });
      if (response.ok) {
        this.currentHistory = [];
        this.displayHistory();
        console.log('History cleared successfully');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to clear history:', error);
      alert('Failed to clear history: ' + error.message);
    }
  }
  startAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    this.refreshInterval = setInterval(() => {
      if (this.isAutoRefresh) {
        this.loadHistory();
      }
    }, 10000); // Refresh every 10 seconds
  }
  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
  async loadPopulations() {
    try {
      const response = await fetch('/api/populations');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      const populations = data.populations || [];
      const populationFilter = document.getElementById('history-population-filter');
      if (populationFilter) {
        // Clear existing options except the first one
        populationFilter.innerHTML = '<option value="">All Populations</option>';

        // Add population options
        populations.forEach(population => {
          const option = document.createElement('option');
          option.value = population.id;
          option.textContent = population.name;
          populationFilter.appendChild(option);
        });
        console.log(`Loaded ${populations.length} populations for history filter`);
      }
    } catch (error) {
      console.error('Failed to load populations for history filter:', error);
    }
  }
  destroy() {
    this.stopAutoRefresh();
  }
}

// Create and export default instance
exports.HistoryManager = HistoryManager;
const historyManager = exports.historyManager = new HistoryManager();

// Export the class and instance

},{}],49:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.localAPIClient = exports.LocalAPIClient = void 0;
/**
 * Local API Client
 * Handles all API calls to the local server (localhost:4000)
 */

class LocalAPIClient {
  /**
   * Create a new LocalAPIClient instance
   * @param {Object} logger - Logger instance
   * @param {string} [baseUrl=''] - Base URL for the API (defaults to relative path)
   */
  constructor(logger, baseUrl = '') {
    this.logger = logger || console;
    this.baseUrl = baseUrl;
  }

  /**
   * Make an API request to the local server
   * @param {string} method - HTTP method (GET, POST, PUT, DELETE, etc.)
   * @param {string} endpoint - API endpoint (without base URL)
   * @param {Object} [data] - Request body (for POST/PUT/PATCH)
   * @param {Object} [options] - Additional options
   * @returns {Promise<Object>} Response data
   */
  async request(method, endpoint, data = null, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const startTime = Date.now();

    // Enhanced options with retry logic
    const requestOptions = {
      ...options,
      retries: options.retries || 3,
      retryDelay: options.retryDelay || 1000 // 1 second base delay
    };

    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // Add authorization if available
    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    // Prepare request body
    let body = null;
    if (data && method !== 'GET') {
      body = JSON.stringify(data);
    }

    // Log the request with minimal details to avoid rate limiting
    const requestLog = {
      type: 'api_request',
      method,
      url,
      timestamp: new Date().toISOString(),
      source: 'local-api-client'
    };
    this.logger.debug('🔄 Local API Request:', requestLog);

    // Retry logic
    let lastError = null;
    for (let attempt = 1; attempt <= requestOptions.retries; attempt++) {
      try {
        const response = await fetch(url, {
          method,
          headers,
          body
        });
        const responseData = await this._handleResponse(response);

        // Log successful response with minimal details
        const responseLog = {
          type: 'api_response',
          status: response.status,
          method,
          duration: Date.now() - startTime,
          attempt: attempt,
          source: 'local-api-client'
        };
        this.logger.debug('✅ Local API Response:', responseLog);
        return responseData;
      } catch (error) {
        lastError = error;
        this.logger.error(`Local API Error (attempt ${attempt}/${requestOptions.retries}):`, error);

        // Get the friendly error message if available
        const friendlyMessage = error.friendlyMessage || error.message;
        const isRateLimit = error.status === 429;

        // Calculate baseDelay and delay here, before using them
        const baseDelay = isRateLimit ? requestOptions.retryDelay * 2 : requestOptions.retryDelay;
        const delay = baseDelay * Math.pow(2, attempt - 1);

        // Show appropriate UI messages based on error type
        if (window.app && window.app.uiManager) {
          if (isRateLimit) {
            if (attempt < requestOptions.retries) {
              // Use enhanced rate limit warning with retry information
              window.app.uiManager.showRateLimitWarning(friendlyMessage, {
                isRetrying: true,
                retryAttempt: attempt,
                maxRetries: requestOptions.retries,
                retryDelay: delay
              });
            } else {
              window.app.uiManager.showError(friendlyMessage);
            }
          } else if (attempt === requestOptions.retries) {
            // For other errors, show friendly message on final attempt
            window.app.uiManager.showError(friendlyMessage);
          }
        }

        // If this is the last attempt, throw with friendly message
        if (attempt === requestOptions.retries) {
          throw error;
        }

        // Only retry for rate limits (429) and server errors (5xx)
        const shouldRetry = isRateLimit || error.status >= 500 || !error.status;
        if (!shouldRetry) {
          // Don't retry for client errors (4xx except 429), throw immediately
          throw error;
        }

        // Use the delay calculated above
        this.logger.info(`Retrying request in ${delay}ms... (attempt ${attempt + 1}/${requestOptions.retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // If all retries fail, throw the last error
    throw lastError;
  }

  /**
   * Handle API response
   * @private
   */
  async _handleResponse(response) {
    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    if (!response.ok) {
      let errorMessage;

      // Provide user-friendly error messages based on status code
      switch (response.status) {
        case 400:
          errorMessage = this._getBadRequestMessage(data, response.url);
          break;
        case 401:
          errorMessage = this._getUnauthorizedMessage();
          break;
        case 403:
          errorMessage = this._getForbiddenMessage(data, response.url);
          break;
        case 404:
          errorMessage = this._getNotFoundMessage(data, response.url);
          break;
        case 429:
          errorMessage = this._getRateLimitMessage();
          break;
        case 500:
        case 501:
        case 502:
        case 503:
        case 504:
          errorMessage = this._getServerErrorMessage(response.status);
          break;
        default:
          errorMessage = data.message || `Request failed with status ${response.status}`;
      }
      const error = new Error(errorMessage);
      error.status = response.status;
      error.details = data;
      error.friendlyMessage = errorMessage;
      throw error;
    }
    return data;
  }

  /**
   * Get user-friendly error message for 400 Bad Request errors
   * @private
   */
  _getBadRequestMessage(data, url) {
    // Check if it's an import endpoint error
    if (url.includes('/import')) {
      if (data && data.error) {
        // Return the specific error message from the server
        return data.error;
      }
      if (data && data.message) {
        return data.message;
      }
      return '🔍 Import failed. Please check your CSV file and settings.';
    }

    // Check if it's a user modification endpoint
    if (url.includes('/users/') && url.includes('PUT')) {
      return '🔍 User data validation failed. Please check the user information and try again.';
    }

    // Check if it's a user creation endpoint
    if (url.includes('/users') && url.includes('POST')) {
      return '🔍 User creation failed due to invalid data. Please check required fields and try again.';
    }

    // Check if it's a population-related error
    if (url.includes('/populations')) {
      return '🔍 Population data is invalid. Please check your population settings.';
    }

    // Generic 400 error
    return '🔍 Request data is invalid. Please check your input and try again.';
  }

  /**
   * Get user-friendly error message for 401 Unauthorized errors
   * @private
   */
  _getUnauthorizedMessage() {
    return '🔑 Authentication failed. Please check your PingOne credentials and try again.';
  }

  /**
   * Get user-friendly error message for 403 Forbidden errors
   * @private
   */
  _getForbiddenMessage(data, url) {
    // Check if it's a user modification endpoint
    if (url.includes('/users/') && url.includes('PUT')) {
      return '🚫 Permission denied. Your PingOne application may not have permission to modify users.';
    }

    // Check if it's a user creation endpoint
    if (url.includes('/users') && url.includes('POST')) {
      return '🚫 Permission denied. Your PingOne application may not have permission to create users.';
    }

    // Check if it's a user deletion endpoint
    if (url.includes('/users/') && url.includes('DELETE')) {
      return '🚫 Permission denied. Your PingOne application may not have permission to delete users.';
    }

    // Generic 403 error
    return '🚫 Access denied. Your PingOne application may not have the required permissions for this operation.';
  }

  /**
   * Get user-friendly error message for 404 Not Found errors
   * @private
   */
  _getNotFoundMessage(data, url) {
    // Check if it's a user-related endpoint
    if (url.includes('/users/')) {
      return '🔍 User not found. The user may have been deleted or the ID is incorrect.';
    }

    // Check if it's a population-related endpoint
    if (url.includes('/populations')) {
      return '🔍 Population not found. Please check your population settings.';
    }

    // Check if it's an environment-related endpoint
    if (url.includes('/environments/')) {
      return '🔍 PingOne environment not found. Please check your environment ID.';
    }

    // Generic 404 error
    return '🔍 Resource not found. Please check the ID or settings and try again.';
  }

  /**
   * Get user-friendly error message for 429 Too Many Requests errors
   * @private
   */
  _getRateLimitMessage() {
    return '⏰ You are sending requests too quickly. Please wait a moment and try again.';
  }

  /**
   * Get user-friendly error message for 500+ server errors
   * @private
   */
  _getServerErrorMessage(status) {
    if (status >= 500) {
      return '🔧 PingOne service is experiencing issues. Please try again in a few minutes.';
    }
    return '🔧 An unexpected error occurred. Please try again.';
  }

  // Convenience methods for common HTTP methods
  get(endpoint, options = {}) {
    return this.request('GET', endpoint, null, options);
  }
  post(endpoint, data, options = {}) {
    return this.request('POST', endpoint, data, options);
  }

  /**
   * Send a POST request with FormData (for file uploads)
   * @param {string} endpoint - API endpoint
   * @param {FormData} formData - FormData object
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Response data
   */
  async postFormData(endpoint, formData, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const startTime = Date.now();

    // Enhanced options with retry logic
    const requestOptions = {
      ...options,
      retries: options.retries || 3,
      retryDelay: options.retryDelay || 1000 // 1 second base delay
    };

    // Prepare headers for FormData (don't set Content-Type, let browser set it with boundary)
    const headers = {
      'Accept': 'application/json'
    };

    // Add authorization if available
    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    // Log the request with minimal details to avoid rate limiting
    const requestLog = {
      type: 'api_request',
      method: 'POST',
      url,
      timestamp: new Date().toISOString(),
      source: 'local-api-client',
      contentType: 'multipart/form-data'
    };
    this.logger.debug('🔄 Local API FormData Request:', requestLog);

    // Retry logic
    let lastError = null;
    for (let attempt = 1; attempt <= requestOptions.retries; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: formData
        });
        const responseData = await this._handleResponse(response);

        // Log successful response with minimal details
        const responseLog = {
          type: 'api_response',
          status: response.status,
          method: 'POST',
          duration: Date.now() - startTime,
          attempt: attempt,
          source: 'local-api-client'
        };
        this.logger.debug('✅ Local API FormData Response:', responseLog);
        return responseData;
      } catch (error) {
        lastError = error;
        this.logger.error(`Local API FormData Error (attempt ${attempt}/${requestOptions.retries}):`, error);

        // Get the friendly error message if available
        const friendlyMessage = error.friendlyMessage || error.message;
        const isRateLimit = error.status === 429;

        // Calculate baseDelay and delay here, before using them
        const baseDelay = isRateLimit ? requestOptions.retryDelay * 2 : requestOptions.retryDelay;
        const delay = baseDelay * Math.pow(2, attempt - 1);

        // Show appropriate UI messages based on error type
        if (window.app && window.app.uiManager) {
          if (isRateLimit) {
            if (attempt < requestOptions.retries) {
              // Use enhanced rate limit warning with retry information
              window.app.uiManager.showRateLimitWarning(friendlyMessage, {
                isRetrying: true,
                retryAttempt: attempt,
                maxRetries: requestOptions.retries,
                retryDelay: delay
              });
            } else {
              window.app.uiManager.showError(friendlyMessage);
            }
          } else if (attempt === requestOptions.retries) {
            // For other errors, show friendly message on final attempt
            window.app.uiManager.showError(friendlyMessage);
          }
        }

        // If this is the last attempt, throw with friendly message
        if (attempt === requestOptions.retries) {
          throw error;
        }

        // Only retry for rate limits (429) and server errors (5xx)
        const shouldRetry = isRateLimit || error.status >= 500 || !error.status;
        if (!shouldRetry) {
          // Don't retry for client errors (4xx except 429), throw immediately
          throw error;
        }

        // Use the delay calculated above
        this.logger.info(`Retrying FormData request in ${delay}ms... (attempt ${attempt + 1}/${requestOptions.retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // If all retries fail, throw the last error
    throw lastError;
  }
  put(endpoint, data, options = {}) {
    return this.request('PUT', endpoint, data, options);
  }
  delete(endpoint, options = {}) {
    return this.request('DELETE', endpoint, null, options);
  }
}

// Export a singleton instance
exports.LocalAPIClient = LocalAPIClient;
const localAPIClient = exports.localAPIClient = new LocalAPIClient(console);

},{}],50:[function(require,module,exports){
(function (process){(function (){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Logger = void 0;
var _winstonLogger = require("./winston-logger.js");
var _messageFormatter = _interopRequireDefault(require("./message-formatter.js"));
var _uiManager = require("./ui-manager.js");
/**
 * @fileoverview Winston-compatible logger for frontend environment
 * 
 * This module provides a Winston-like logging interface for the frontend
 * that maintains consistency with server-side Winston logging while
 * working within browser constraints.
 * 
 * Features:
 * - Winston-compatible API (info, warn, error, debug)
 * - Structured logging with metadata
 * - Timestamp formatting
 * - Log level filtering
 * - Console and server transport support
 * - Error stack trace handling
 * - Environment-aware configuration
 */

const ui = window.app && window.app.uiManager;

/**
 * Winston-compatible logger for browser environment
 */
class Logger {
  constructor(logElement = null) {
    this.logElement = logElement;
    this.logs = [];
    this.validCount = 0;
    this.errorCount = 0;
    this.initialized = false;
    this.serverLoggingEnabled = true;
    this.isLoadingLogs = false;
    this.offlineLogs = [];

    // Initialize Winston-compatible logger
    this.winstonLogger = (0, _winstonLogger.createWinstonLogger)({
      service: 'pingone-import-frontend',
      environment: process.env.NODE_ENV || 'development',
      enableServerLogging: true,
      enableConsoleLogging: true
    });
    this.initialize();
  }

  /**
   * Initialize the logger
   */
  initialize() {
    try {
      this.winstonLogger.info('Logger initialized successfully');
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize logger:', error);
    }
  }

  /**
   * Temporarily disable server logging to prevent feedback loops
   */
  disableServerLogging() {
    this.serverLoggingEnabled = false;
    this.winstonLogger.setServerLogging(false);
    this.winstonLogger.debug('Server logging disabled');
  }

  /**
   * Re-enable server logging
   */
  enableServerLogging() {
    this.serverLoggingEnabled = true;
    this.winstonLogger.setServerLogging(true);
    this.winstonLogger.debug('Server logging enabled');
  }

  /**
   * Set flag to indicate we're loading logs (prevents server logging)
   */
  setLoadingLogs(isLoading) {
    this.isLoadingLogs = isLoading;
    this.winstonLogger.debug(`Loading logs flag set to: ${isLoading}`);
  }

  /**
   * Create a safe file logger that handles initialization and errors
   * @private
   */
  _createSafeFileLogger() {
    const logger = {
      _initialized: false,
      _logger: null,
      _queue: [],
      _initializing: false,
      async init() {
        if (this._initialized || this._initializing) return;
        this._initializing = true;
        try {
          // Simulate file logger initialization
          this._logger = {
            log: (level, message, data) => {
              this.winstonLogger.log(level, message, data);
            }
          };
          this._initialized = true;
          this._processQueue();
        } catch (error) {
          this.winstonLogger.error('Failed to initialize file logger', {
            error: error.message
          });
        } finally {
          this._initializing = false;
        }
      },
      _processQueue() {
        while (this._queue.length > 0) {
          const {
            level,
            message,
            data
          } = this._queue.shift();
          this._logger.log(level, message, data);
        }
      },
      log(level, message, data) {
        if (this._initialized) {
          this._logger.log(level, message, data);
        } else {
          this._queue.push({
            level,
            message,
            data
          });
          if (!this._initializing) {
            this.init();
          }
        }
      }
    };
    return logger;
  }

  /**
   * Parse log arguments into structured format
   * @private
   */
  _parseLogArgs(args) {
    let message = 'Log message';
    let data = null;
    let context = null;
    if (args.length > 0) {
      if (typeof args[0] === 'string') {
        message = args[0];
        if (args.length > 1 && typeof args[1] === 'object') {
          data = args[1];
          if (args.length > 2 && typeof args[2] === 'object') {
            context = args[2];
          }
        }
      } else if (typeof args[0] === 'object') {
        data = args[0];
        message = 'Log data';
        if (args.length > 1 && typeof args[1] === 'object') {
          context = args[1];
        }
      }
    }
    return [message, data, context];
  }

  /**
   * Main logging method with Winston integration
   */
  log(level, message, data = {}) {
    try {
      // Parse arguments if needed
      if (typeof level === 'string' && typeof message === 'string') {
        // Direct call: log(level, message, data)
        this._logToWinston(level, message, data);
      } else {
        // Legacy call: log(message, level)
        const [parsedMessage, parsedData, context] = this._parseLogArgs(arguments);
        this._logToWinston(level || 'info', parsedMessage, {
          ...parsedData,
          ...context
        });
      }

      // Update UI if log element exists
      this._updateLogUI({
        level,
        message,
        data,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error in logger.log:', error);
    }
  }

  /**
   * Log to Winston with proper formatting
   * @private
   */
  _logToWinston(level, message, data = {}) {
    const logData = {
      ...data,
      component: 'frontend-logger',
      timestamp: new Date().toISOString()
    };
    this.winstonLogger.log(level, message, logData);
  }

  /**
   * Log info level message
   */
  info(message, data = {}) {
    this.log('info', message, data);
  }

  /**
   * Log warn level message
   */
  warn(message, data = {}) {
    this.log('warn', message, data);
  }

  /**
   * Log error level message
   */
  error(message, data = {}) {
    this.log('error', message, data);
    if (ui) ui.showStatusBar(message, 'error', {
      autoDismiss: false
    });
    this.errorCount++;
    this.updateSummary();
  }

  /**
   * Log debug level message
   */
  debug(message, data = {}) {
    this.log('debug', message, data);
  }

  /**
   * Log success level message
   */
  success(message, data = {}) {
    this.log('info', message, {
      ...data,
      type: 'success'
    });
    this.validCount++;
    this.updateSummary();
  }

  /**
   * Log error with stack trace
   */
  errorWithStack(message, error, data = {}) {
    this.winstonLogger.errorWithStack(message, error, data);
    this.errorCount++;
    this.updateSummary();
  }

  /**
   * Update log UI with new entry
   * @private
   */
  _updateLogUI(logEntry) {
    if (!this.logElement) return;
    try {
      const logElement = document.createElement('div');
      logElement.className = `log-entry ${logEntry.level}`;

      // Create timestamp
      const timestamp = document.createElement('span');
      timestamp.className = 'log-timestamp';
      timestamp.textContent = new Date(logEntry.timestamp).toLocaleTimeString();
      logElement.appendChild(timestamp);

      // Create level badge
      const levelBadge = document.createElement('span');
      levelBadge.className = 'log-level';
      levelBadge.textContent = logEntry.level.toUpperCase();
      logElement.appendChild(levelBadge);

      // Create message with formatting
      const message = document.createElement('span');
      message.className = 'log-message';

      // Format the message for better readability
      let formattedMessage = logEntry.message;
      if (logEntry.data && logEntry.data.type) {
        // Format based on message type
        switch (logEntry.data.type) {
          case 'progress':
            formattedMessage = _messageFormatter.default.formatProgressMessage(logEntry.data.operation || 'import', logEntry.data.current || 0, logEntry.data.total || 0, logEntry.message, logEntry.data.counts || {});
            break;
          case 'error':
            formattedMessage = _messageFormatter.default.formatErrorMessage(logEntry.data.operation || 'import', logEntry.message, logEntry.data);
            break;
          case 'completion':
            formattedMessage = _messageFormatter.default.formatCompletionMessage(logEntry.data.operation || 'import', logEntry.data);
            break;
          default:
            // Use original message for other types
            formattedMessage = logEntry.message;
        }
      }
      message.textContent = formattedMessage;
      logElement.appendChild(message);

      // Add details if present
      if (logEntry.data && Object.keys(logEntry.data).length > 0) {
        const detailsElement = document.createElement('div');
        detailsElement.className = 'log-details';
        const detailsTitle = document.createElement('h4');
        detailsTitle.textContent = 'Details';
        detailsElement.appendChild(detailsTitle);
        const detailsContent = document.createElement('pre');
        detailsContent.className = 'log-detail-json';
        detailsContent.textContent = JSON.stringify(logEntry.data, null, 2);
        detailsElement.appendChild(detailsContent);
        logElement.appendChild(detailsElement);
      }

      // Insert at top (newest first)
      if (this.logElement.firstChild) {
        this.logElement.insertBefore(logElement, this.logElement.firstChild);
      } else {
        this.logElement.appendChild(logElement);
      }

      // Auto-scroll to top
      this.logElement.scrollTop = 0;

      // Limit UI logs
      const maxUILogs = 100;
      while (this.logElement.children.length > maxUILogs) {
        this.logElement.removeChild(this.logElement.lastChild);
      }
    } catch (error) {
      console.error('Error updating log UI:', error);
    }
  }

  /**
   * Send log to server
   * @private
   */
  async _sendToServer(logEntry) {
    if (!this.serverLoggingEnabled || this.isLoadingLogs) {
      return;
    }
    try {
      await fetch('/api/logs/ui', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          level: logEntry.level,
          message: logEntry.message,
          data: logEntry.data
        })
      });
    } catch (error) {
      this.winstonLogger.warn('Failed to send log to server', {
        error: error.message
      });
      this.offlineLogs.push(logEntry);
    }
  }

  /**
   * Render all logs to UI
   */
  renderLogs() {
    if (!this.logElement) return;
    this.logElement.innerHTML = '';
    this.logs.forEach(log => this._updateLogUI(log));
    this.logElement.scrollTop = this.logElement.scrollHeight;
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
    if (this.logElement) {
      this.logElement.innerHTML = '';
    }
    this.winstonLogger.info('Logs cleared');
  }

  /**
   * Get all logs
   */
  getLogs() {
    return [...this.logs];
  }

  /**
   * Update summary display
   */
  updateSummary() {
    // Implementation depends on UI structure
    this.winstonLogger.debug('Summary updated', {
      validCount: this.validCount,
      errorCount: this.errorCount
    });
  }

  /**
   * Clear summary
   */
  clearSummary() {
    this.validCount = 0;
    this.errorCount = 0;
    this.winstonLogger.debug('Summary cleared');
  }
}

// Export the Logger class
exports.Logger = Logger;

}).call(this)}).call(this,require('_process'))
},{"./message-formatter.js":51,"./ui-manager.js":58,"./winston-logger.js":60,"@babel/runtime/helpers/interopRequireDefault":1,"_process":25}],51:[function(require,module,exports){
(function (process){(function (){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.MessageFormatter = void 0;
var _winstonLogger = require("./winston-logger.js");
/**
 * Enhanced Message Formatter Module
 * 
 * Improves readability of server messages with:
 * - Visual separators and formatting
 * - Structured message blocks
 * - Event grouping and labeling
 * - Timestamp formatting
 * - Color coding and styling
 * 
 * Features:
 * - Message block separation with asterisks
 * - Event start/end markers
 * - Structured formatting with line breaks
 * - Timestamp and label formatting
 * - Consistent styling across all message types
 */

/**
 * Enhanced Message Formatter Class
 * 
 * Formats server messages for improved readability in logs and progress windows
 */
class MessageFormatter {
  constructor() {
    this.logger = (0, _winstonLogger.createWinstonLogger)({
      service: 'pingone-message-formatter',
      environment: process.env.NODE_ENV || 'development'
    });

    // Message formatting options
    this.formattingOptions = {
      showTimestamps: true,
      showEventMarkers: true,
      showSeparators: true,
      maxMessageLength: 200,
      separatorChar: '*',
      separatorLength: 50
    };

    // Event type configurations
    this.eventTypes = {
      import: {
        start: 'IMPORT STARTED',
        end: 'IMPORT COMPLETED',
        error: 'IMPORT ERROR',
        color: '#3498db'
      },
      export: {
        start: 'EXPORT STARTED',
        end: 'EXPORT COMPLETED',
        error: 'EXPORT ERROR',
        color: '#27ae60'
      },
      modify: {
        start: 'MODIFY STARTED',
        end: 'MODIFY COMPLETED',
        error: 'MODIFY ERROR',
        color: '#f39c12'
      },
      delete: {
        start: 'DELETE STARTED',
        end: 'DELETE COMPLETED',
        error: 'DELETE ERROR',
        color: '#e74c3c'
      },
      validation: {
        start: 'VALIDATION STARTED',
        end: 'VALIDATION COMPLETED',
        error: 'VALIDATION ERROR',
        color: '#9b59b6'
      },
      connection: {
        start: 'CONNECTION ESTABLISHED',
        end: 'CONNECTION CLOSED',
        error: 'CONNECTION ERROR',
        color: '#1abc9c'
      }
    };
  }

  /**
   * Format a message block with visual separators
   * @param {string} eventType - Type of event (import, export, etc.)
   * @param {string} eventStage - Stage of the event (start, end, error, progress)
   * @param {string} message - The main message
   * @param {Object} details - Additional details
   * @returns {string} Formatted message block
   */
  formatMessageBlock(eventType, eventStage, message, details = {}) {
    try {
      const eventConfig = this.eventTypes[eventType] || this.eventTypes.import;
      const timestamp = this.formatTimestamp(new Date());
      const separator = this.createSeparator();
      let formattedMessage = '';

      // Add separator at the beginning
      if (this.formattingOptions.showSeparators) {
        formattedMessage += separator + '\n';
      }

      // Add event marker
      if (this.formattingOptions.showEventMarkers) {
        const marker = this.getEventMarker(eventConfig, eventStage);
        formattedMessage += `${marker}\n`;
      }

      // Add timestamp
      if (this.formattingOptions.showTimestamps) {
        formattedMessage += `[${timestamp}] `;
      }

      // Add main message
      formattedMessage += message + '\n';

      // Add details if present
      if (details && Object.keys(details).length > 0) {
        formattedMessage += this.formatDetails(details);
      }

      // Add separator at the end
      if (this.formattingOptions.showSeparators) {
        formattedMessage += separator + '\n';
      }
      this.logger.debug('Message block formatted', {
        eventType,
        eventStage,
        messageLength: message.length
      });
      return formattedMessage;
    } catch (error) {
      this.logger.error('Error formatting message block', {
        error: error.message
      });
      return message; // Fallback to original message
    }
  }

  /**
   * Format a progress update message
   * @param {string} operation - Operation type
   * @param {number} current - Current progress
   * @param {number} total - Total items
   * @param {string} message - Progress message
   * @param {Object} stats - Progress statistics
   * @returns {string} Formatted progress message
   */
  formatProgressMessage(operation, current, total, message, stats = {}) {
    try {
      const timestamp = this.formatTimestamp(new Date());
      const percentage = total > 0 ? Math.round(current / total * 100) : 0;
      let formattedMessage = '';

      // Add timestamp
      if (this.formattingOptions.showTimestamps) {
        formattedMessage += `[${timestamp}] `;
      }

      // Add progress indicator
      formattedMessage += `PROGRESS: ${current}/${total} (${percentage}%)`;

      // Add message if provided
      if (message) {
        formattedMessage += ` - ${message}`;
      }

      // Add stats if available
      if (stats && Object.keys(stats).length > 0) {
        formattedMessage += '\n' + this.formatProgressStats(stats);
      }
      return formattedMessage;
    } catch (error) {
      this.logger.error('Error formatting progress message', {
        error: error.message
      });
      return message || `Progress: ${current}/${total}`;
    }
  }

  /**
   * Format an error message with context
   * @param {string} operation - Operation type
   * @param {string} errorMessage - Error message
   * @param {Object} errorDetails - Error details
   * @returns {string} Formatted error message
   */
  formatErrorMessage(operation, errorMessage, errorDetails = {}) {
    try {
      const eventConfig = this.eventTypes[operation] || this.eventTypes.import;
      const timestamp = this.formatTimestamp(new Date());
      const separator = this.createSeparator();
      let formattedMessage = '';

      // Add separator
      if (this.formattingOptions.showSeparators) {
        formattedMessage += separator + '\n';
      }

      // Add error marker
      formattedMessage += `${eventConfig.error}\n`;

      // Add timestamp and error message
      if (this.formattingOptions.showTimestamps) {
        formattedMessage += `[${timestamp}] `;
      }
      formattedMessage += `ERROR: ${errorMessage}\n`;

      // Add error details if present
      if (errorDetails && Object.keys(errorDetails).length > 0) {
        formattedMessage += this.formatErrorDetails(errorDetails);
      }

      // Add separator
      if (this.formattingOptions.showSeparators) {
        formattedMessage += separator + '\n';
      }
      return formattedMessage;
    } catch (error) {
      this.logger.error('Error formatting error message', {
        error: error.message
      });
      return `ERROR: ${errorMessage}`;
    }
  }

  /**
   * Format a completion message with results
   * @param {string} operation - Operation type
   * @param {Object} results - Operation results
   * @returns {string} Formatted completion message
   */
  formatCompletionMessage(operation, results = {}) {
    try {
      const eventConfig = this.eventTypes[operation] || this.eventTypes.import;
      const timestamp = this.formatTimestamp(new Date());
      const separator = this.createSeparator();
      let formattedMessage = '';

      // Add separator
      if (this.formattingOptions.showSeparators) {
        formattedMessage += separator + '\n';
      }

      // Add completion marker
      formattedMessage += `${eventConfig.end}\n`;

      // Add timestamp
      if (this.formattingOptions.showTimestamps) {
        formattedMessage += `[${timestamp}] `;
      }

      // Add completion message
      formattedMessage += `Operation completed successfully\n`;

      // Add results if present
      if (results && Object.keys(results).length > 0) {
        formattedMessage += this.formatResults(results);
      }

      // Add separator
      if (this.formattingOptions.showSeparators) {
        formattedMessage += separator + '\n';
      }
      return formattedMessage;
    } catch (error) {
      this.logger.error('Error formatting completion message', {
        error: error.message
      });
      return 'Operation completed successfully';
    }
  }

  /**
   * Format SSE event data for display
   * @param {Object} eventData - SSE event data
   * @returns {string} Formatted event message
   */
  formatSSEEvent(eventData) {
    try {
      const {
        type,
        message,
        current,
        total,
        counts,
        error
      } = eventData;
      const timestamp = this.formatTimestamp(new Date());
      let formattedMessage = '';

      // Add timestamp
      if (this.formattingOptions.showTimestamps) {
        formattedMessage += `[${timestamp}] `;
      }

      // Format based on event type
      switch (type) {
        case 'progress':
          formattedMessage += this.formatProgressMessage('import', current, total, message, counts);
          break;
        case 'completion':
          formattedMessage += this.formatCompletionMessage('import', eventData);
          break;
        case 'error':
          formattedMessage += this.formatErrorMessage('import', message, eventData);
          break;
        default:
          formattedMessage += `SSE EVENT [${type.toUpperCase()}]: ${message || 'No message'}`;
      }
      return formattedMessage;
    } catch (error) {
      this.logger.error('Error formatting SSE event', {
        error: error.message
      });
      return eventData.message || 'SSE event received';
    }
  }

  /**
   * Create a visual separator line
   * @returns {string} Separator string
   */
  createSeparator() {
    const char = this.formattingOptions.separatorChar;
    const length = this.formattingOptions.separatorLength;
    return char.repeat(length);
  }

  /**
   * Get event marker based on event type and stage
   * @param {Object} eventConfig - Event configuration
   * @param {string} stage - Event stage
   * @returns {string} Event marker
   */
  getEventMarker(eventConfig, stage) {
    switch (stage) {
      case 'start':
        return eventConfig.start;
      case 'end':
        return eventConfig.end;
      case 'error':
        return eventConfig.error;
      default:
        return eventConfig.start;
    }
  }

  /**
   * Format timestamp for display
   * @param {Date} date - Date to format
   * @returns {string} Formatted timestamp
   */
  formatTimestamp(date) {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  /**
   * Format details object for display
   * @param {Object} details - Details object
   * @returns {string} Formatted details
   */
  formatDetails(details) {
    try {
      let formatted = '';
      for (const [key, value] of Object.entries(details)) {
        if (value !== null && value !== undefined) {
          formatted += `  ${key}: ${value}\n`;
        }
      }
      return formatted;
    } catch (error) {
      this.logger.error('Error formatting details', {
        error: error.message
      });
      return '';
    }
  }

  /**
   * Format progress statistics
   * @param {Object} stats - Progress statistics
   * @returns {string} Formatted statistics
   */
  formatProgressStats(stats) {
    try {
      let formatted = '  Statistics:\n';
      const statLabels = {
        processed: 'Processed',
        success: 'Success',
        failed: 'Failed',
        skipped: 'Skipped',
        duplicates: 'Duplicates'
      };
      for (const [key, value] of Object.entries(stats)) {
        if (value !== null && value !== undefined && statLabels[key]) {
          formatted += `    ${statLabels[key]}: ${value}\n`;
        }
      }
      return formatted;
    } catch (error) {
      this.logger.error('Error formatting progress stats', {
        error: error.message
      });
      return '';
    }
  }

  /**
   * Format error details
   * @param {Object} errorDetails - Error details
   * @returns {string} Formatted error details
   */
  formatErrorDetails(errorDetails) {
    try {
      let formatted = '  Error Details:\n';
      for (const [key, value] of Object.entries(errorDetails)) {
        if (value !== null && value !== undefined) {
          formatted += `    ${key}: ${value}\n`;
        }
      }
      return formatted;
    } catch (error) {
      this.logger.error('Error formatting error details', {
        error: error.message
      });
      return '';
    }
  }

  /**
   * Format operation results
   * @param {Object} results - Operation results
   * @returns {string} Formatted results
   */
  formatResults(results) {
    try {
      let formatted = '  Results:\n';
      const resultLabels = {
        total: 'Total Records',
        success: 'Successful',
        failed: 'Failed',
        skipped: 'Skipped',
        duplicates: 'Duplicates',
        duration: 'Duration'
      };
      for (const [key, value] of Object.entries(results)) {
        if (value !== null && value !== undefined && resultLabels[key]) {
          let displayValue = value;
          if (key === 'duration' && typeof value === 'number') {
            displayValue = this.formatDuration(value);
          }
          formatted += `    ${resultLabels[key]}: ${displayValue}\n`;
        }
      }
      return formatted;
    } catch (error) {
      this.logger.error('Error formatting results', {
        error: error.message
      });
      return '';
    }
  }

  /**
   * Format duration in milliseconds to human readable format
   * @param {number} milliseconds - Duration in milliseconds
   * @returns {string} Formatted duration
   */
  formatDuration(milliseconds) {
    try {
      const seconds = Math.floor(milliseconds / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      if (hours > 0) {
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
      } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
      } else {
        return `${seconds}s`;
      }
    } catch (error) {
      this.logger.error('Error formatting duration', {
        error: error.message
      });
      return `${milliseconds}ms`;
    }
  }

  /**
   * Update formatting options
   * @param {Object} options - New formatting options
   */
  updateFormattingOptions(options) {
    try {
      this.formattingOptions = {
        ...this.formattingOptions,
        ...options
      };
      this.logger.debug('Formatting options updated', {
        options
      });
    } catch (error) {
      this.logger.error('Error updating formatting options', {
        error: error.message
      });
    }
  }

  /**
   * Get current formatting options
   * @returns {Object} Current formatting options
   */
  getFormattingOptions() {
    return {
      ...this.formattingOptions
    };
  }
}

// Create and export singleton instance
exports.MessageFormatter = MessageFormatter;
const messageFormatter = exports.default = new MessageFormatter();

}).call(this)}).call(this,require('_process'))
},{"./winston-logger.js":60,"_process":25}],52:[function(require,module,exports){
(function (process){(function (){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.pingOneClient = exports.PingOneClient = void 0;
var _winstonLogger = require("./winston-logger.js");
var _uiManager = require("./ui-manager.js");
/**
 * @fileoverview PingOne Client Class
 * 
 * Handles authentication and API communication with PingOne services.
 * Manages token acquisition, caching, and API requests with Winston logging.
 * 
 * Features:
 * - Token management with localStorage caching
 * - Automatic token refresh
 * - API request handling with retry logic
 * - User import and modification operations
 * - Winston logging integration
 */

const ui = window.app && window.app.uiManager;
function handleClientError(error) {
  let userMessage = 'An unexpected error occurred. Please try again.';
  if (error && error.message) {
    if (error.message.includes('Network')) {
      userMessage = 'Network error – check your connection.';
    } else if (error.message.includes('timeout')) {
      userMessage = 'Request timed out – try again.';
    } else if (error.message.includes('401')) {
      userMessage = 'Session expired – please log in again.';
    } else if (error.message.includes('404')) {
      userMessage = 'Resource not found.';
    }
  }
  if (ui) ui.showStatusBar(userMessage, 'error');
}

/**
 * PingOne Client Class
 * 
 * Manages PingOne API authentication and requests with Winston logging.
 */
class PingOneClient {
  constructor() {
    // Initialize Winston logger
    this.logger = (0, _winstonLogger.createWinstonLogger)({
      service: 'pingone-import-client',
      environment: process.env.NODE_ENV || 'development'
    });
    this.accessToken = null;
    this.tokenExpiry = null;
    this.baseUrl = '/api/pingone';
    this.initialize();
  }

  /**
   * Initialize the client
   */
  initialize() {
    try {
      this.loadTokenFromStorage();
      this.logger.info('PingOne client initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize PingOne client', {
        error: error.message
      });
    }
  }

  /**
   * Load token from localStorage
   */
  loadTokenFromStorage() {
    try {
      if (typeof localStorage !== 'undefined') {
        const storedToken = localStorage.getItem('pingone_worker_token');
        const storedExpiry = localStorage.getItem('pingone_token_expiry');
        if (storedToken && storedExpiry) {
          const expiryTime = parseInt(storedExpiry, 10);
          const now = Date.now();
          if (expiryTime > now) {
            this.accessToken = storedToken;
            this.tokenExpiry = expiryTime;
            this.logger.info('Token loaded from storage', {
              hasToken: !!this.accessToken,
              expiryTime: new Date(this.tokenExpiry).toISOString()
            });
          } else {
            this.logger.warn('Stored token has expired');
            this.clearToken();
          }
        } else {
          this.logger.debug('No stored token found');
        }
      } else {
        this.logger.warn('localStorage is not available');
      }
    } catch (error) {
      this.logger.error('Error loading token from storage', {
        error: error.message
      });
    }
  }

  /**
   * Save token to localStorage
   */
  saveTokenToStorage(token, expiresIn) {
    try {
      if (typeof localStorage !== 'undefined') {
        const expiryTime = Date.now() + expiresIn * 1000;
        localStorage.setItem('pingone_worker_token', token);
        localStorage.setItem('pingone_token_expiry', expiryTime.toString());
        this.accessToken = token;
        this.tokenExpiry = expiryTime;
        this.logger.info('Token saved to storage', {
          tokenLength: token.length,
          expiresIn,
          expiryTime: new Date(expiryTime).toISOString()
        });
        return true;
      } else {
        this.logger.warn('localStorage is not available, cannot save token');
        return false;
      }
    } catch (error) {
      this.logger.error('Error saving token to storage', {
        error: error.message
      });
      return false;
    }
  }

  /**
   * Clear token from storage
   */
  clearToken() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('pingone_worker_token');
        localStorage.removeItem('pingone_token_expiry');
      }
      this.accessToken = null;
      this.tokenExpiry = null;
      this.logger.info('Token cleared from storage');
    } catch (error) {
      this.logger.error('Error clearing token from storage', {
        error: error.message
      });
    }
  }

  /**
   * Get cached token (alias for getCurrentTokenTimeRemaining for compatibility)
   * Production-ready with comprehensive error handling and validation
   */
  getCachedToken() {
    try {
      // Validate token existence and format
      if (!this.accessToken || typeof this.accessToken !== 'string') {
        this.logger.debug('No valid cached token available');
        return null;
      }

      // Validate expiry timestamp
      if (!this.tokenExpiry || typeof this.tokenExpiry !== 'number') {
        this.logger.warn('Invalid token expiry timestamp');
        this.clearToken(); // Clean up invalid state
        return null;
      }
      const now = Date.now();
      const isExpired = this.tokenExpiry <= now;

      // Add buffer time (5 minutes) to prevent edge cases
      const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
      const isNearExpiry = this.tokenExpiry - now <= bufferTime;
      if (isExpired) {
        this.logger.debug('Cached token is expired');
        this.clearToken(); // Clean up expired token
        return null;
      }
      if (isNearExpiry) {
        this.logger.warn('Token is near expiry, consider refreshing');
      }

      // Validate token format (basic JWT structure check)
      if (!this.accessToken.includes('.') || this.accessToken.split('.').length !== 3) {
        this.logger.error('Invalid token format detected');
        this.clearToken(); // Clean up invalid token
        return null;
      }
      this.logger.debug('Returning valid cached token');
      return this.accessToken;
    } catch (error) {
      this.logger.error('Error getting cached token', {
        error: error.message,
        stack: error.stack,
        tokenLength: this.accessToken ? this.accessToken.length : 0
      });
      // Don't expose token in logs for security
      return null;
    }
  }

  /**
   * Get current token time remaining
   */
  getCurrentTokenTimeRemaining() {
    try {
      if (!this.accessToken || !this.tokenExpiry) {
        return {
          token: null,
          timeRemaining: null,
          isExpired: true
        };
      }
      const now = Date.now();
      const timeRemaining = Math.max(0, this.tokenExpiry - now);
      const isExpired = timeRemaining === 0;
      const timeRemainingFormatted = this.formatDuration(Math.floor(timeRemaining / 1000));
      this.logger.debug('Token time remaining calculated', {
        timeRemaining: timeRemainingFormatted,
        isExpired
      });
      return {
        token: this.accessToken,
        timeRemaining: timeRemainingFormatted,
        isExpired
      };
    } catch (error) {
      this.logger.error('Error getting token time remaining', {
        error: error.message
      });
      return {
        token: null,
        timeRemaining: null,
        isExpired: true
      };
    }
  }

  /**
   * Format duration in human-readable format
   */
  formatDuration(seconds) {
    if (seconds <= 0) return 'Expired';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor(seconds % 3600 / 60);
    const remainingSeconds = seconds % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  }

  /**
   * Get access token with caching and refresh logic
   */
  async getAccessToken() {
    try {
      this.logger.debug('getAccessToken called');

      // Check if we have a valid cached token
      const tokenInfo = this.getCurrentTokenTimeRemaining();
      if (tokenInfo.token && !tokenInfo.isExpired) {
        this.logger.debug('Using cached token', {
          tokenPreview: tokenInfo.token.substring(0, 8) + '...',
          timeRemaining: tokenInfo.timeRemaining
        });
        return tokenInfo.token;
      }
      this.logger.debug('Fetching token from /api/pingone/get-token');

      // Fetch new token from server
      const response = await fetch('/api/pingone/get-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      this.logger.debug('Fetch response', {
        status: response.status,
        ok: response.ok
      });
      if (!response.ok) {
        const errorMsg = await response.text();
        this.logger.error('Fetch error', {
          status: response.status,
          error: errorMsg
        });
        throw new Error(`Failed to get token: ${response.status} ${errorMsg}`);
      }
      const data = await response.json();
      this.logger.debug('Data received from server', {
        hasAccessToken: !!data.access_token,
        expiresIn: data.expires_in
      });
      if (!data.access_token) {
        this.logger.warn('No access_token in server response', {
          data
        });
        throw new Error('No access token received from server');
      }

      // Save token to storage
      const tokenSaved = this.saveTokenToStorage(data.access_token, data.expires_in);
      if (tokenSaved) {
        this.logger.debug('Token saved to localStorage', {
          tokenLength: data.access_token.length,
          expiresIn: data.expires_in
        });
      } else {
        this.logger.warn('Failed to store token in localStorage');
      }
      return data.access_token;
    } catch (error) {
      this.logger.error('Error in getAccessToken', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Make authenticated API request with retry logic
   */
  async makeRequest(method, url, data = null, retryAttempts = 3) {
    try {
      const token = await this.getAccessToken();
      for (let attempt = 1; attempt <= retryAttempts; attempt++) {
        try {
          this.logger.debug(`Making API request (attempt ${attempt})`, {
            method,
            url,
            hasData: !!data
          });
          const requestOptions = {
            method,
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          };
          if (data) {
            requestOptions.body = JSON.stringify(data);
          }
          const response = await fetch(`${this.baseUrl}${url}`, requestOptions);
          this.logger.debug(`API request completed (attempt ${attempt})`, {
            status: response.status,
            ok: response.ok
          });
          if (response.ok) {
            const responseData = await response.json();
            return responseData;
          } else {
            const errorText = await response.text();
            this.logger.warn(`API request failed (attempt ${attempt})`, {
              status: response.status,
              error: errorText
            });
            if (attempt === retryAttempts) {
              throw new Error(`API request failed: ${response.status} ${errorText}`);
            }
          }
        } catch (error) {
          this.logger.error(`API request error (attempt ${attempt})`, {
            error: error.message
          });
          if (attempt === retryAttempts) {
            throw error;
          }

          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    } catch (error) {
      this.logger.error('All API request attempts failed', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Import users from CSV data
   */
  async importUsers(csvData, options = {}) {
    try {
      this.logger.info('importUsers method called', {
        userCount: csvData.length,
        options: Object.keys(options)
      });
      const {
        populationId = null,
        batchSize = 10,
        retryAttempts = 3,
        enableUsers = true,
        skipDuplicatesByEmail = false,
        skipDuplicatesByUsername = false
      } = options;
      this.logger.debug('Initial setup completed', {
        batchSize,
        retryAttempts,
        enableUsers,
        skipDuplicatesByEmail,
        skipDuplicatesByUsername
      });

      // Validate input
      if (!csvData || !Array.isArray(csvData) || csvData.length === 0) {
        throw new Error('Invalid CSV data: must be a non-empty array');
      }
      this.logger.debug('Input validation completed');

      // Handle population selection
      let fallbackPopulationId = populationId;
      if (!fallbackPopulationId) {
        const populationSelect = document.getElementById('import-population-select');
        if (populationSelect && populationSelect.value) {
          fallbackPopulationId = populationSelect.value;
          this.logger.debug('Using selected population from dropdown', {
            fallbackPopulationId
          });
        } else {
          // Try to get from settings
          const settings = JSON.parse(localStorage.getItem('pingone-import-settings') || '{}');
          fallbackPopulationId = settings.populationId;
          this.logger.debug('Using default population from settings', {
            fallbackPopulationId
          });
        }
      }

      // Prepare sets for duplicate detection
      const seenEmails = new Set();
      const seenUsernames = new Set();

      // Process users in batches
      const totalUsers = csvData.length;
      const results = {
        success: true,
        processed: 0,
        created: 0,
        skipped: 0,
        failed: 0,
        errors: []
      };
      this.logger.debug('Starting user processing loop...');
      for (let i = 0; i < totalUsers; i += batchSize) {
        const batch = csvData.slice(i, i + batchSize);
        this.logger.debug(`Processing batch ${Math.floor(i / batchSize) + 1}`, {
          users: `${i + 1}-${Math.min(i + batchSize, totalUsers)}`,
          batchSize: batch.length
        });
        for (const user of batch) {
          try {
            const userPopulationId = user.populationId || fallbackPopulationId;
            if (!userPopulationId) {
              const error = `Missing population – user not processed. Username: ${user.email || user.username}`;
              results.errors.push(error);
              results.skipped++;
              continue;
            }

            // Duplicate detection
            if (skipDuplicatesByEmail && user.email) {
              if (seenEmails.has(user.email.toLowerCase())) {
                this.logger.info(`Skipping duplicate user by email: ${user.email}`);
                results.skipped++;
                continue;
              }
              seenEmails.add(user.email.toLowerCase());
            }
            if (skipDuplicatesByUsername && user.username) {
              if (seenUsernames.has(user.username.toLowerCase())) {
                this.logger.info(`Skipping duplicate user by username: ${user.username}`);
                results.skipped++;
                continue;
              }
              seenUsernames.add(user.username.toLowerCase());
            }

            // Create user
            const userData = {
              username: user.username || user.email,
              email: user.email,
              name: {
                given: user.firstName || user.givenName || '',
                family: user.lastName || user.familyName || ''
              },
              enabled: enableUsers,
              population: {
                id: userPopulationId
              }
            };

            // Add optional fields
            if (user.phoneNumber) userData.phoneNumber = user.phoneNumber;
            if (user.company) userData.company = user.company;
            const result = await this.createUser(userData, retryAttempts);
            if (result.success) {
              results.created++;
              // Disable user if requested
              if (!enableUsers && result.userId) {
                this.logger.debug(`Disabling user ${result.userId} after creation`);
                try {
                  await this.makeRequest('PATCH', `/environments/current/users/${result.userId}`, {
                    enabled: false
                  });
                  this.logger.debug(`Successfully disabled user ${result.userId}`);
                } catch (statusError) {
                  this.logger.warn(`Failed to disable user ${result.userId}`, {
                    error: statusError.message
                  });
                }
              }
            } else {
              results.failed++;
              results.errors.push(result.error);
            }
            results.processed++;
          } catch (error) {
            results.failed++;
            results.errors.push(error.message);
          }
        }
      }
      this.logger.info('Batch import summary', {
        total: totalUsers,
        processed: results.processed,
        created: results.created,
        skipped: results.skipped,
        failed: results.failed
      });
      return results;
    } catch (error) {
      this.logger.error('Import users failed', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Create a single user
   */
  async createUser(userData, retryAttempts = 3) {
    try {
      for (let attempt = 1; attempt <= retryAttempts; attempt++) {
        try {
          this.logger.debug(`Making API request for user ${userData.email || userData.username} (attempt ${attempt}/${retryAttempts})`);
          const result = await this.makeRequest('POST', '/environments/current/users', userData);
          this.logger.debug(`API request completed for user ${userData.email || userData.username}`);
          if (result.id) {
            const successMessage = `Successfully created user: ${userData.username || userData.email}`;
            this.logger.info(successMessage, {
              userId: result.id,
              populationId: userData.population.id
            });
            return {
              success: true,
              userId: result.id,
              user: result
            };
          } else {
            this.logger.warn('Invalid response structure - no ID found', {
              result
            });
            return {
              success: false,
              error: 'Invalid response structure'
            };
          }
        } catch (error) {
          if (error.message.includes('already exists')) {
            this.logger.debug(`User already exists: ${userData.email || userData.username}`);
            return {
              success: true,
              userId: null,
              user: null,
              message: 'User already exists'
            };
          }
          this.logger.error(`API request failed for user ${userData.email || userData.username} (attempt ${attempt})`, {
            error: error.message
          });
          if (attempt === retryAttempts) {
            return {
              success: false,
              error: error.message
            };
          }

          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    } catch (error) {
      this.logger.error('Create user failed', {
        error: error.message,
        userData
      });
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Create and export default instance
exports.PingOneClient = PingOneClient;
const pingOneClient = exports.pingOneClient = new PingOneClient();

// Export the class and instance

}).call(this)}).call(this,require('_process'))
},{"./ui-manager.js":58,"./winston-logger.js":60,"_process":25}],53:[function(require,module,exports){
(function (process){(function (){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _winstonLogger = require("./winston-logger.js");
var _elementRegistry = require("./element-registry.js");
var _sessionManager = require("./session-manager.js");
var _messageFormatter = _interopRequireDefault(require("./message-formatter.js"));
/**
 * Enhanced Progress Manager Module
 * 
 * Modern, real-time progress UI system with Socket.IO and WebSocket fallback:
 * - Real-time updates via Socket.IO (primary)
 * - WebSocket fallback for reliability
 * - Professional Ping Identity design system
 * - Responsive and accessible
 * - Enhanced visual feedback
 * - Step-by-step progress tracking
 * 
 * Features:
 * - Real-time progress updates via Socket.IO
 * - WebSocket fallback for connection issues
 * - Professional progress indicators
 * - Step-by-step operation tracking
 * - Enhanced error handling and recovery
 * - Accessibility compliance
 * - Production-ready logging
 */

// Enable debug mode for development (set to false in production)
const DEBUG_MODE = process.env.NODE_ENV !== 'production';

/**
 * Enhanced Progress Manager Class
 * 
 * Manages all progress-related UI updates with real-time Socket.IO and WebSocket integration
 */
class ProgressManager {
  constructor() {
    this.logger = (0, _winstonLogger.createWinstonLogger)('pingone-progress');
    this.isEnabled = true; // Will be set to false if progress container is not found
    this.currentOperation = null;
    this.currentSessionId = null;
    this.isActive = false;
    this.startTime = null;
    this.timingInterval = null;
    this.progressCallback = null;
    this.completeCallback = null;
    this.cancelCallback = null;
    this.duplicateHandlingMode = 'skip';

    // Real-time communication
    this.socket = null;
    this.websocket = null;
    this.connectionType = null; // 'socketio' or 'websocket'
    this.connectionRetries = 0;
    this.maxRetries = 3;

    // Stats tracking
    this.stats = {
      processed: 0,
      success: 0,
      failed: 0,
      skipped: 0,
      total: 0
    };
    this.logger.debug('ProgressManager initialized');
  }

  /**
   * Initialize the progress manager
   */
  initialize() {
    try {
      this.setupElements();
      this.setupEventListeners();
      this.logger.info('Enhanced progress manager initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize progress manager', {
        error: error.message
      });
    }
  }

  /**
   * Setup DOM elements with enhanced design
   */
  setupElements() {
    try {
      // Main progress container - use existing one from HTML
      this.progressContainer = document.getElementById('progress-container');
      if (!this.progressContainer) {
        this.logger.warn('Progress container not found in HTML - progress functionality will be disabled');
        this.isEnabled = false;
        return;
      }

      // Create enhanced progress content
      this.progressContainer.innerHTML = `
                <div class="progress-overlay">
                    <div class="progress-modal">
                        <div class="progress-header">
                            <div class="operation-info">
                                <h3 class="operation-title">
                                    <i class="fas fa-cog fa-spin"></i>
                                    <span class="title-text">Operation in Progress</span>
                                </h3>
                                <div class="operation-subtitle">Processing your request...</div>
                            </div>
                            <button class="cancel-operation" type="button" aria-label="Cancel operation">
                                <i class="fas fa-times"></i>
                                <span>Cancel</span>
                            </button>
                        </div>
                        
                        <div class="progress-content">
                            <div class="progress-steps">
                                <div class="step active" data-step="init">
                                    <div class="step-icon">
                                        <i class="fas fa-play"></i>
                                    </div>
                                    <div class="step-label">Initializing</div>
                                </div>
                                <div class="step" data-step="validate">
                                    <div class="step-icon">
                                        <i class="fas fa-check"></i>
                                    </div>
                                    <div class="step-label">Validating</div>
                                </div>
                                <div class="step" data-step="process">
                                    <div class="step-icon">
                                        <i class="fas fa-cogs"></i>
                                    </div>
                                    <div class="step-label">Processing</div>
                                </div>
                                <div class="step" data-step="complete">
                                    <div class="step-icon">
                                        <i class="fas fa-check-circle"></i>
                                    </div>
                                    <div class="step-label">Complete</div>
                                </div>
                            </div>
                            
                            <div class="progress-main">
                                <div class="progress-bar-container">
                                    <div class="progress-bar">
                                        <div class="progress-bar-fill"></div>
                                        <div class="progress-bar-glow"></div>
                                    </div>
                                    <div class="progress-percentage">0%</div>
                                </div>
                                
                                <div class="progress-text">Preparing operation...</div>
                                
                                <div class="progress-stats">
                                    <div class="stat-item">
                                        <span class="stat-label">Processed:</span>
                                        <span class="stat-value processed">0</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">Success:</span>
                                        <span class="stat-value success">0</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">Failed:</span>
                                        <span class="stat-value failed">0</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">Skipped:</span>
                                        <span class="stat-value skipped">0</span>
                                    </div>
                                </div>
                                
                                <div class="progress-timing">
                                    <div class="time-elapsed">
                                        <i class="fas fa-clock"></i>
                                        <span>Time: <span class="elapsed-value">00:00</span></span>
                                    </div>
                                    <div class="time-remaining">
                                        <i class="fas fa-hourglass-half"></i>
                                        <span>ETA: <span class="eta-value">Calculating...</span></span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="progress-details">
                                <div class="details-header">
                                    <h4><i class="fas fa-info-circle"></i> Operation Details</h4>
                                </div>
                                <div class="details-content">
                                    <div class="detail-item">
                                        <span class="detail-label">Operation Type:</span>
                                        <span class="detail-value operation-type">-</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Population:</span>
                                        <span class="detail-value population-name">-</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">File:</span>
                                        <span class="detail-value file-name">-</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Status:</span>
                                        <span class="detail-value status-text">Initializing...</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Connection:</span>
                                        <span class="detail-value connection-type">-</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="duplicate-handling" style="display: none;">
                            <div class="duplicate-header">
                                <h4><i class="fas fa-exclamation-triangle"></i> Duplicate Handling</h4>
                            </div>
                            <div class="duplicate-content">
                                <div class="duplicate-mode">
                                    <label>
                                        <input type="radio" name="duplicateMode" value="skip" checked>
                                        <span>Skip duplicates</span>
                                    </label>
                                    <label>
                                        <input type="radio" name="duplicateMode" value="update">
                                        <span>Update existing</span>
                                    </label>
                                    <label>
                                        <input type="radio" name="duplicateMode" value="create">
                                        <span>Create new</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

      // Cache important elements
      this.progressBar = this.progressContainer.querySelector('.progress-bar-fill');
      this.progressPercentage = this.progressContainer.querySelector('.progress-percentage');
      this.progressText = this.progressContainer.querySelector('.progress-text');
      this.operationTitle = this.progressContainer.querySelector('.operation-title .title-text');
      this.operationSubtitle = this.progressContainer.querySelector('.operation-subtitle');
      this.statusText = this.progressContainer.querySelector('.status-text');
      this.connectionType = this.progressContainer.querySelector('.connection-type');
      this.cancelButton = this.progressContainer.querySelector('.cancel-operation');
      this.steps = this.progressContainer.querySelectorAll('.step');
      this.statsElements = {
        processed: this.progressContainer.querySelector('.stat-value.processed'),
        success: this.progressContainer.querySelector('.stat-value.success'),
        failed: this.progressContainer.querySelector('.stat-value.failed'),
        skipped: this.progressContainer.querySelector('.stat-value.skipped')
      };
      this.timingElements = {
        elapsed: this.progressContainer.querySelector('.elapsed-value'),
        eta: this.progressContainer.querySelector('.eta-value')
      };
      this.detailElements = {
        operationType: this.progressContainer.querySelector('.detail-value.operation-type'),
        populationName: this.progressContainer.querySelector('.detail-value.population-name'),
        fileName: this.progressContainer.querySelector('.detail-value.file-name')
      };
      this.logger.debug('Progress elements setup complete');
    } catch (error) {
      this.logger.error('Error setting up progress elements', {
        error: error.message
      });
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    try {
      if (this.cancelButton) {
        this.cancelButton.addEventListener('click', () => this.cancelOperation());
      }

      // Duplicate handling mode changes
      const duplicateModeInputs = this.progressContainer.querySelectorAll('input[name="duplicateMode"]');
      duplicateModeInputs.forEach(input => {
        input.addEventListener('change', e => {
          this.duplicateHandlingMode = e.target.value;
          this.logger.debug('Duplicate handling mode changed', {
            mode: this.duplicateHandlingMode
          });
        });
      });
      this.logger.debug('Event listeners setup complete');
    } catch (error) {
      this.logger.error('Error setting up event listeners', {
        error: error.message
      });
    }
  }

  /**
   * Start a new operation with enhanced real-time communication
   */
  startOperation(operationType, options = {}) {
    try {
      this.logger.info('Starting operation', {
        operationType,
        options
      });
      this.currentOperation = operationType;
      this.isActive = true;
      this.startTime = Date.now();
      this.connectionRetries = 0;

      // Reset stats
      this.resetOperationStats();

      // Update operation details
      this.updateOperationTitle(operationType);
      this.updateOperationDetails(options);
      this.updateOperationStatus('initializing', 'Starting operation...');

      // Show progress UI
      this.showProgress();

      // Start timing updates
      this.startTimingUpdates();

      // Initialize real-time connection when session ID is available
      if (options.sessionId) {
        this.initializeRealTimeConnection(options.sessionId);
      }
      this.logger.info('Operation started successfully', {
        operationType
      });
    } catch (error) {
      this.logger.error('Error starting operation', {
        error: error.message,
        operationType
      });
      this.handleOperationError('Failed to start operation', {
        error: error.message
      });
    }
  }

  /**
   * Initialize real-time connection with Socket.IO and WebSocket fallback
   */
  initializeRealTimeConnection(sessionId) {
    try {
      if (!sessionId) {
        this.logger.warn('No session ID provided for real-time connection');
        this.updateOperationStatus('info', 'Operation started. Real-time progress will be available once connection is established.');
        return;
      }

      // Use session manager to validate session ID if available
      if (typeof _sessionManager.sessionManager !== 'undefined' && _sessionManager.sessionManager.validateSessionId) {
        if (!_sessionManager.sessionManager.validateSessionId(sessionId)) {
          this.logger.error('Invalid session ID format', {
            sessionId,
            type: typeof sessionId
          });
          this.updateOperationStatus('error', 'Invalid session ID format. Real-time progress tracking unavailable.');
          return;
        }

        // Register session with session manager
        _sessionManager.sessionManager.registerSession(sessionId, this.currentOperation || 'unknown', {
          startTime: this.startTime,
          stats: this.stats
        });
      } else {
        this.logger.warn('Session manager not available - proceeding without session validation');
      }
      this.currentSessionId = sessionId;

      // Close existing connections
      this.closeConnections();

      // Try Socket.IO first, then WebSocket fallback
      this.trySocketIOConnection(sessionId);
    } catch (error) {
      this.logger.error('Error initializing real-time connection', {
        error: error.message,
        sessionId
      });
    }
  }

  /**
   * Try Socket.IO connection first
   */
  trySocketIOConnection(sessionId) {
    try {
      this.logger.info('Attempting Socket.IO connection', {
        sessionId
      });
      this.updateOperationStatus('connecting', 'Establishing Socket.IO connection...');

      // Check if Socket.IO is available
      if (typeof io === 'undefined') {
        this.logger.warn('Socket.IO not available, trying WebSocket fallback');
        this.tryWebSocketConnection(sessionId);
        return;
      }

      // Create Socket.IO connection
      this.socket = io({
        timeout: 5000,
        forceNew: true
      });

      // Register session
      this.socket.emit('registerSession', sessionId);

      // Handle connection events
      this.socket.on('connect', () => {
        this.logger.info('Socket.IO connection established', {
          sessionId
        });
        this.connectionType = 'socketio';
        this.updateConnectionType('Socket.IO');
        this.updateOperationStatus('connected', 'Real-time connection established via Socket.IO');
      });
      this.socket.on('disconnect', () => {
        this.logger.warn('Socket.IO connection disconnected', {
          sessionId
        });
        this.updateOperationStatus('disconnected', 'Connection lost. Attempting to reconnect...');
      });
      this.socket.on('connect_error', error => {
        this.logger.error('Socket.IO connection error', {
          error: error.message,
          sessionId
        });
        this.updateOperationStatus('error', 'Socket.IO connection failed. Trying WebSocket fallback...');
        this.tryWebSocketConnection(sessionId);
      });

      // Handle progress events
      this.socket.on('progress', data => {
        this.logger.info('Socket.IO progress event received', {
          data
        });
        this.handleProgressEvent(data);
      });
      this.socket.on('completion', data => {
        this.logger.info('Socket.IO completion event received', {
          data
        });
        this.handleCompletionEvent(data);
      });
      this.socket.on('error', data => {
        this.logger.error('Socket.IO error event received', {
          data
        });
        this.handleErrorEvent(data);
      });
    } catch (error) {
      this.logger.error('Error setting up Socket.IO connection', {
        error: error.message,
        sessionId
      });
      this.tryWebSocketConnection(sessionId);
    }
  }

  /**
   * Try WebSocket connection as fallback
   */
  tryWebSocketConnection(sessionId) {
    try {
      this.logger.info('Attempting WebSocket connection', {
        sessionId
      });
      this.updateOperationStatus('connecting', 'Establishing WebSocket connection...');

      // Check if WebSocket is available
      if (typeof WebSocket === 'undefined') {
        this.logger.error('WebSocket not available');
        this.updateOperationStatus('error', 'No real-time communication available');
        return;
      }

      // Create WebSocket connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      this.websocket = new WebSocket(wsUrl);

      // Handle WebSocket events
      this.websocket.onopen = () => {
        this.logger.info('WebSocket connection established', {
          sessionId
        });
        this.connectionType = 'websocket';
        this.updateConnectionType('WebSocket');
        this.updateOperationStatus('connected', 'Real-time connection established via WebSocket');

        // Register session
        this.websocket.send(JSON.stringify({
          sessionId
        }));
      };
      this.websocket.onclose = () => {
        this.logger.warn('WebSocket connection closed', {
          sessionId
        });
        this.updateOperationStatus('disconnected', 'WebSocket connection closed');
      };
      this.websocket.onerror = error => {
        this.logger.error('WebSocket connection error', {
          error: error.message,
          sessionId
        });
        this.updateOperationStatus('error', 'WebSocket connection failed');
        this.handleConnectionFailure();
      };
      this.websocket.onmessage = event => {
        try {
          const data = JSON.parse(event.data);
          this.logger.info('WebSocket message received', {
            data
          });
          this.handleProgressEvent(data);
        } catch (error) {
          this.logger.error('Error parsing WebSocket message', {
            error: error.message,
            data: event.data
          });
        }
      };
    } catch (error) {
      this.logger.error('Error setting up WebSocket connection', {
        error: error.message,
        sessionId
      });
      this.handleConnectionFailure();
    }
  }

  /**
   * Handle connection failure and retry logic
   */
  handleConnectionFailure() {
    this.connectionRetries++;
    if (this.connectionRetries < this.maxRetries) {
      this.logger.warn('Connection failed, retrying', {
        retry: this.connectionRetries,
        maxRetries: this.maxRetries
      });
      this.updateOperationStatus('retrying', `Connection failed. Retrying (${this.connectionRetries}/${this.maxRetries})...`);

      // Retry after delay
      setTimeout(() => {
        if (this.currentSessionId) {
          this.initializeRealTimeConnection(this.currentSessionId);
        }
      }, 2000 * this.connectionRetries); // Exponential backoff
    } else {
      this.logger.error('Max connection retries reached');
      this.updateOperationStatus('error', 'Failed to establish real-time connection after multiple attempts');
    }
  }

  /**
   * Close all connections
   */
  closeConnections() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.connectionType = null;
  }

  /**
   * Update session ID after operation starts
   */
  updateSessionId(sessionId) {
    try {
      if (!sessionId) {
        this.logger.warn('Attempted to update with null/undefined session ID');
        return;
      }

      // Use session manager to validate session ID if available
      if (typeof _sessionManager.sessionManager !== 'undefined' && _sessionManager.sessionManager.validateSessionId) {
        if (!_sessionManager.sessionManager.validateSessionId(sessionId)) {
          this.logger.error('Invalid session ID provided for update', {
            sessionId
          });
          this.updateOperationStatus('error', 'Invalid session ID format. Real-time progress tracking unavailable.');
          return;
        }
      } else {
        this.logger.warn('Session manager not available - proceeding without session validation');
      }
      this.logger.info('Updating session ID', {
        sessionId
      });
      this.currentSessionId = sessionId;

      // Re-initialize real-time connection with new session ID
      this.initializeRealTimeConnection(sessionId);
    } catch (error) {
      this.logger.error('Error updating session ID', {
        error: error.message,
        sessionId
      });
    }
  }

  /**
   * Handle progress events from real-time connections
   */
  handleProgressEvent(data) {
    try {
      this.logger.info('Progress event received', {
        data
      });
      if (!this.progressReceived && data.type === 'progress') {
        this.progressReceived = true;
        if (this.progressTimeout) {
          clearTimeout(this.progressTimeout);
          this.progressTimeout = null;
        }
      }

      // Format the event message for better readability
      const formattedMessage = _messageFormatter.default.formatProgressMessage(this.currentOperation || 'import', data.current || 0, data.total || 0, data.message || '', data.counts || {});
      this.updateProgress(data.current, data.total, data.message, data.counts);
    } catch (error) {
      this.logger.error('Error handling progress event', {
        error: error.message,
        data
      });
    }
  }

  /**
   * Handle completion events from real-time connections
   */
  handleCompletionEvent(data) {
    try {
      this.logger.info('Completion event received', {
        data
      });
      this.completeOperation(data);
    } catch (error) {
      this.logger.error('Error handling completion event', {
        error: error.message,
        data
      });
    }
  }

  /**
   * Handle error events from real-time connections
   */
  handleErrorEvent(data) {
    try {
      this.logger.error('Error event received', {
        data
      });
      this.handleOperationError(data.message || 'Operation error', data.details || {});
    } catch (error) {
      this.logger.error('Error handling error event', {
        error: error.message,
        data
      });
    }
  }

  /**
   * Update progress with enhanced visual feedback
   */
  updateProgress(current, total, message = '', details = {}) {
    try {
      // Update stats
      if (details.processed !== undefined) this.stats.processed = details.processed;
      if (details.success !== undefined) this.stats.success = details.success;
      if (details.failed !== undefined) this.stats.failed = details.failed;
      if (details.skipped !== undefined) this.stats.skipped = details.skipped;

      // Calculate percentage
      const percentage = total > 0 ? Math.round(current / total * 100) : 0;

      // Update progress bar
      if (this.progressBar) {
        this.progressBar.style.width = `${percentage}%`;
        this.progressBar.setAttribute('aria-valuenow', percentage);
      }

      // Update percentage display
      if (this.progressPercentage) {
        this.progressPercentage.textContent = `${percentage}%`;
      }

      // Update progress text with formatted message
      if (this.progressText) {
        const formattedProgressMessage = _messageFormatter.default.formatProgressMessage(this.currentOperation || 'import', current, total, message, details);
        this.progressText.textContent = formattedProgressMessage;
      }

      // Update stats display
      this.updateStatsDisplay();

      // Update step indicator based on progress
      this.updateStepIndicatorBasedOnProgress(percentage);

      // Update operation status
      this.updateOperationStatus('processing', message);

      // Trigger callback
      if (this.progressCallback) {
        this.progressCallback(current, total, message, details);
      }
      this.logger.debug('Progress updated', {
        current,
        total,
        percentage,
        message,
        stats: this.stats
      });
    } catch (error) {
      this.logger.error('Error updating progress', {
        error: error.message
      });
    }
  }

  /**
   * Update stats display
   */
  updateStatsDisplay() {
    try {
      if (this.statsElements.processed) {
        this.statsElements.processed.textContent = this.stats.processed;
      }
      if (this.statsElements.success) {
        this.statsElements.success.textContent = this.stats.success;
      }
      if (this.statsElements.failed) {
        this.statsElements.failed.textContent = this.stats.failed;
      }
      if (this.statsElements.skipped) {
        this.statsElements.skipped.textContent = this.stats.skipped;
      }
    } catch (error) {
      this.logger.error('Error updating stats display', {
        error: error.message
      });
    }
  }

  /**
   * Update step indicator based on progress percentage
   */
  updateStepIndicatorBasedOnProgress(percentage) {
    try {
      let step = 'init';
      if (percentage > 0 && percentage < 25) {
        step = 'validate';
      } else if (percentage >= 25 && percentage < 90) {
        step = 'process';
      } else if (percentage >= 90) {
        step = 'complete';
      }
      this.updateStepIndicator(step);
    } catch (error) {
      this.logger.error('Error updating step indicator', {
        error: error.message
      });
    }
  }

  /**
   * Update step indicator
   */
  updateStepIndicator(step) {
    try {
      this.steps.forEach(stepElement => {
        stepElement.classList.remove('active', 'completed');
        if (stepElement.dataset.step === step) {
          stepElement.classList.add('active');
        } else if (this.getStepOrder(stepElement.dataset.step) < this.getStepOrder(step)) {
          stepElement.classList.add('completed');
        }
      });
    } catch (error) {
      this.logger.error('Error updating step indicator', {
        error: error.message
      });
    }
  }

  /**
   * Get step order for comparison
   */
  getStepOrder(step) {
    const order = {
      'init': 0,
      'validate': 1,
      'process': 2,
      'complete': 3
    };
    return order[step] || 0;
  }

  /**
   * Start timing updates
   */
  startTimingUpdates() {
    try {
      this.timingInterval = setInterval(() => {
        this.updateTiming();
      }, 1000);
    } catch (error) {
      this.logger.error('Error starting timing updates', {
        error: error.message
      });
    }
  }

  /**
   * Update timing display
   */
  updateTiming() {
    try {
      if (!this.startTime) return;
      const elapsed = Date.now() - this.startTime;
      const elapsedFormatted = this.formatDuration(elapsed);
      if (this.timingElements.elapsed) {
        this.timingElements.elapsed.textContent = elapsedFormatted;
      }

      // Calculate ETA based on progress
      if (this.stats.total > 0 && this.stats.processed > 0) {
        const progress = this.stats.processed / this.stats.total;
        const estimatedTotal = elapsed / progress;
        const remaining = estimatedTotal - elapsed;
        const etaFormatted = this.formatDuration(remaining);
        if (this.timingElements.eta) {
          this.timingElements.eta.textContent = etaFormatted;
        }
      } else {
        if (this.timingElements.eta) {
          this.timingElements.eta.textContent = 'Calculating...';
        }
      }
    } catch (error) {
      this.logger.error('Error updating timing', {
        error: error.message
      });
    }
  }

  /**
   * Complete operation
   */
  completeOperation(results = {}) {
    try {
      this.logger.info('Operation completed', {
        results
      });
      this.isActive = false;

      // Stop timing updates
      if (this.timingInterval) {
        clearInterval(this.timingInterval);
        this.timingInterval = null;
      }

      // Update final progress
      if (results.total) {
        this.updateProgress(results.total, results.total, 'Operation completed', results);
      }

      // Update step indicator
      this.updateStepIndicator('complete');

      // Update operation status
      this.updateOperationStatus('completed', 'Operation completed successfully');

      // Show completion message
      if (this.progressText) {
        const successCount = results.success || this.stats.success;
        const totalCount = results.total || this.stats.total;
        this.progressText.textContent = `Operation completed! Processed ${totalCount} items with ${successCount} successful.`;
      }

      // Trigger completion callback
      if (this.completeCallback) {
        this.completeCallback(results);
      }

      // Auto-hide after delay
      setTimeout(() => {
        this.hideProgress();
      }, 3000);
    } catch (error) {
      this.logger.error('Error completing operation', {
        error: error.message,
        results
      });
    }
  }

  /**
   * Handle operation error
   */
  handleOperationError(message, details = {}) {
    try {
      this.logger.error('Operation error', {
        message,
        details
      });
      this.isActive = false;

      // Stop timing updates
      if (this.timingInterval) {
        clearInterval(this.timingInterval);
        this.timingInterval = null;
      }

      // Update operation status
      this.updateOperationStatus('error', message);

      // Show error message
      if (this.progressText) {
        this.progressText.textContent = `Error: ${message}`;
      }

      // Update step indicator to show error
      this.steps.forEach(step => {
        step.classList.remove('active', 'completed');
        step.classList.add('error');
      });
    } catch (error) {
      this.logger.error('Error handling operation error', {
        error: error.message
      });
    }
  }

  /**
   * Cancel operation
   */
  cancelOperation() {
    try {
      this.logger.info('Operation cancelled by user');
      this.isActive = false;

      // Stop timing updates
      if (this.timingInterval) {
        clearInterval(this.timingInterval);
        this.timingInterval = null;
      }

      // Close connections
      this.closeConnections();

      // Update operation status
      this.updateOperationStatus('cancelled', 'Operation cancelled by user');

      // Trigger cancel callback
      if (this.cancelCallback) {
        this.cancelCallback();
      }

      // Hide progress
      this.hideProgress();
    } catch (error) {
      this.logger.error('Error cancelling operation', {
        error: error.message
      });
    }
  }

  /**
   * Show progress UI
   */
  showProgress() {
    try {
      if (this.progressContainer) {
        this.progressContainer.style.display = 'block';
        this.progressContainer.classList.add('active');
      }
    } catch (error) {
      this.logger.error('Error showing progress', {
        error: error.message
      });
    }
  }

  /**
   * Hide progress UI
   */
  hideProgress() {
    try {
      if (this.progressContainer) {
        this.progressContainer.classList.remove('active');
        setTimeout(() => {
          this.progressContainer.style.display = 'none';
        }, 300);
      }
    } catch (error) {
      this.logger.error('Error hiding progress', {
        error: error.message
      });
    }
  }

  /**
   * Update operation title
   */
  updateOperationTitle(operationType) {
    try {
      if (this.operationTitle) {
        const titles = {
          'import': 'Import Operation',
          'export': 'Export Operation',
          'delete': 'Delete Operation',
          'update': 'Update Operation'
        };
        this.operationTitle.textContent = titles[operationType] || 'Operation in Progress';
      }
    } catch (error) {
      this.logger.error('Error updating operation title', {
        error: error.message
      });
    }
  }

  /**
   * Update operation details
   */
  updateOperationDetails(options = {}) {
    try {
      if (this.detailElements.operationType) {
        this.detailElements.operationType.textContent = options.operationType || this.currentOperation || '-';
      }
      if (this.detailElements.populationName) {
        this.detailElements.populationName.textContent = options.populationName || '-';
      }
      if (this.detailElements.fileName) {
        this.detailElements.fileName.textContent = options.fileName || '-';
      }
    } catch (error) {
      this.logger.error('Error updating operation details', {
        error: error.message
      });
    }
  }

  /**
   * Update operation status
   */
  updateOperationStatus(status, message = '') {
    try {
      if (this.statusText) {
        this.statusText.textContent = message || status;
      }
    } catch (error) {
      this.logger.error('Error updating operation status', {
        error: error.message
      });
    }
  }

  /**
   * Update connection type display
   */
  updateConnectionType(type) {
    try {
      if (this.connectionType) {
        this.connectionType.textContent = type || '-';
      }
    } catch (error) {
      this.logger.error('Error updating connection type', {
        error: error.message
      });
    }
  }

  /**
   * Reset operation stats
   */
  resetOperationStats() {
    try {
      this.stats = {
        processed: 0,
        success: 0,
        failed: 0,
        skipped: 0,
        total: 0
      };
      this.updateStatsDisplay();
    } catch (error) {
      this.logger.error('Error resetting operation stats', {
        error: error.message
      });
    }
  }

  /**
   * Format duration in MM:SS format
   */
  formatDuration(milliseconds) {
    try {
      const seconds = Math.floor(milliseconds / 1000);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } catch (error) {
      this.logger.error('Error formatting duration', {
        error: error.message
      });
      return '00:00';
    }
  }

  /**
   * Set progress callback
   */
  setProgressCallback(callback) {
    this.progressCallback = callback;
  }

  /**
   * Set completion callback
   */
  setCompleteCallback(callback) {
    this.completeCallback = callback;
  }

  /**
   * Set cancel callback
   */
  setCancelCallback(callback) {
    this.cancelCallback = callback;
  }

  /**
   * Debug logging
   */
  debugLog(area, message) {
    if (DEBUG_MODE) {
      this.logger.debug(`[${area}] ${message}`);
    }
  }

  /**
   * Destroy progress manager
   */
  destroy() {
    try {
      this.closeConnections();
      if (this.timingInterval) {
        clearInterval(this.timingInterval);
        this.timingInterval = null;
      }
      this.isActive = false;
      this.currentOperation = null;
      this.currentSessionId = null;
      this.logger.info('Progress manager destroyed');
    } catch (error) {
      this.logger.error('Error destroying progress manager', {
        error: error.message
      });
    }
  }
}

// Create and export singleton instance
const progressManager = new ProgressManager();
var _default = exports.default = progressManager;

}).call(this)}).call(this,require('_process'))
},{"./element-registry.js":44,"./message-formatter.js":51,"./session-manager.js":54,"./winston-logger.js":60,"@babel/runtime/helpers/interopRequireDefault":1,"_process":25}],54:[function(require,module,exports){
(function (process){(function (){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sessionManager = exports.default = void 0;
var _winstonLogger = require("./winston-logger.js");
/**
 * Session Manager for PingOne Import Tool
 * 
 * Handles session ID generation, validation, and management for SSE connections
 * across all operations (import, export, modify, delete).
 * 
 * Features:
 * - Centralized session ID generation
 * - Session ID validation and format checking
 * - Session tracking and cleanup
 * - Error handling for missing/invalid session IDs
 */

/**
 * Session Manager Class
 */
class SessionManager {
  constructor() {
    this.logger = (0, _winstonLogger.createWinstonLogger)({
      service: 'pingone-import-session',
      environment: process.env.NODE_ENV || 'development'
    });
    this.activeSessions = new Map();
    this.sessionCounter = 0;
  }

  /**
   * Generate a unique session ID
   * @returns {string} Unique session identifier
   */
  generateSessionId() {
    try {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 15);
      const counter = ++this.sessionCounter;
      const sessionId = `session_${timestamp}_${random}_${counter}`;
      this.logger.debug('Session ID generated', {
        sessionId
      });
      return sessionId;
    } catch (error) {
      this.logger.error('Error generating session ID', {
        error: error.message
      });
      // Fallback to simple timestamp-based ID
      return `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }
  }

  /**
   * Validate session ID format and structure
   * @param {string} sessionId - Session ID to validate
   * @returns {boolean} True if valid, false otherwise
   */
  validateSessionId(sessionId) {
    try {
      if (!sessionId || typeof sessionId !== 'string') {
        this.logger.warn('Session ID validation failed: null/undefined/non-string', {
          sessionId,
          type: typeof sessionId
        });
        return false;
      }
      if (sessionId.trim() === '') {
        this.logger.warn('Session ID validation failed: empty string');
        return false;
      }

      // Check for minimum length (should be at least 8 characters)
      if (sessionId.length < 8) {
        this.logger.warn('Session ID validation failed: too short', {
          length: sessionId.length
        });
        return false;
      }

      // Check for valid characters (alphanumeric, underscore, hyphen)
      const validPattern = /^[a-zA-Z0-9_-]+$/;
      if (!validPattern.test(sessionId)) {
        this.logger.warn('Session ID validation failed: invalid characters', {
          sessionId
        });
        return false;
      }
      this.logger.debug('Session ID validation passed', {
        sessionId
      });
      return true;
    } catch (error) {
      this.logger.error('Error validating session ID', {
        error: error.message,
        sessionId
      });
      return false;
    }
  }

  /**
   * Register an active session
   * @param {string} sessionId - Session ID to register
   * @param {string} operationType - Type of operation (import, export, etc.)
   * @param {Object} metadata - Additional session metadata
   */
  registerSession(sessionId, operationType, metadata = {}) {
    try {
      if (!this.validateSessionId(sessionId)) {
        this.logger.error('Cannot register invalid session ID', {
          sessionId,
          operationType
        });
        return false;
      }
      const sessionData = {
        sessionId,
        operationType,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        metadata
      };
      this.activeSessions.set(sessionId, sessionData);
      this.logger.info('Session registered', {
        sessionId,
        operationType,
        metadata
      });
      return true;
    } catch (error) {
      this.logger.error('Error registering session', {
        error: error.message,
        sessionId,
        operationType
      });
      return false;
    }
  }

  /**
   * Update session activity timestamp
   * @param {string} sessionId - Session ID to update
   */
  updateSessionActivity(sessionId) {
    try {
      const session = this.activeSessions.get(sessionId);
      if (session) {
        session.lastActivity = Date.now();
        this.logger.debug('Session activity updated', {
          sessionId
        });
      } else {
        this.logger.warn('Session not found for activity update', {
          sessionId
        });
      }
    } catch (error) {
      this.logger.error('Error updating session activity', {
        error: error.message,
        sessionId
      });
    }
  }

  /**
   * Unregister a session
   * @param {string} sessionId - Session ID to unregister
   */
  unregisterSession(sessionId) {
    try {
      const session = this.activeSessions.get(sessionId);
      if (session) {
        this.activeSessions.delete(sessionId);
        this.logger.info('Session unregistered', {
          sessionId,
          operationType: session.operationType
        });
      } else {
        this.logger.warn('Session not found for unregistration', {
          sessionId
        });
      }
    } catch (error) {
      this.logger.error('Error unregistering session', {
        error: error.message,
        sessionId
      });
    }
  }

  /**
   * Get session information
   * @param {string} sessionId - Session ID to retrieve
   * @returns {Object|null} Session data or null if not found
   */
  getSession(sessionId) {
    try {
      return this.activeSessions.get(sessionId) || null;
    } catch (error) {
      this.logger.error('Error getting session', {
        error: error.message,
        sessionId
      });
      return null;
    }
  }

  /**
   * Get all active sessions
   * @returns {Array} Array of active session data
   */
  getActiveSessions() {
    try {
      return Array.from(this.activeSessions.values());
    } catch (error) {
      this.logger.error('Error getting active sessions', {
        error: error.message
      });
      return [];
    }
  }

  /**
   * Clean up expired sessions
   * @param {number} maxAge - Maximum age in milliseconds (default: 1 hour)
   */
  cleanupExpiredSessions(maxAge = 60 * 60 * 1000) {
    try {
      const now = Date.now();
      const expiredSessions = [];
      for (const [sessionId, session] of this.activeSessions.entries()) {
        if (now - session.lastActivity > maxAge) {
          expiredSessions.push(sessionId);
        }
      }
      expiredSessions.forEach(sessionId => {
        this.unregisterSession(sessionId);
      });
      if (expiredSessions.length > 0) {
        this.logger.info('Cleaned up expired sessions', {
          count: expiredSessions.length
        });
      }
    } catch (error) {
      this.logger.error('Error cleaning up expired sessions', {
        error: error.message
      });
    }
  }

  /**
   * Get session statistics
   * @returns {Object} Session statistics
   */
  getSessionStats() {
    try {
      const sessions = this.getActiveSessions();
      const stats = {
        total: sessions.length,
        byOperation: {},
        oldest: null,
        newest: null
      };
      sessions.forEach(session => {
        // Count by operation type
        stats.byOperation[session.operationType] = (stats.byOperation[session.operationType] || 0) + 1;

        // Track oldest and newest
        if (!stats.oldest || session.createdAt < stats.oldest.createdAt) {
          stats.oldest = session;
        }
        if (!stats.newest || session.createdAt > stats.newest.createdAt) {
          stats.newest = session;
        }
      });
      return stats;
    } catch (error) {
      this.logger.error('Error getting session stats', {
        error: error.message
      });
      return {
        total: 0,
        byOperation: {},
        oldest: null,
        newest: null
      };
    }
  }
}

// Export singleton instance
const sessionManager = exports.sessionManager = new SessionManager();
var _default = exports.default = sessionManager;

}).call(this)}).call(this,require('_process'))
},{"./winston-logger.js":60,"_process":25}],55:[function(require,module,exports){
(function (process){(function (){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SettingsManager = void 0;
var _winstonLogger = require("./winston-logger.js");
var _cryptoUtils = require("./crypto-utils.js");
/**
 * @fileoverview Settings Manager Class
 * 
 * Manages application settings with secure storage and encryption.
 * Handles API credentials, user preferences, and configuration data
 * with automatic encryption for sensitive information.
 * 
 * @param {Object} logger - Winston logger instance for debugging
 */

class SettingsManager {
  constructor(logger = null) {
    // Initialize settings with default values
    this.settings = this.getDefaultSettings();
    this.storageKey = 'pingone-import-settings';
    this.encryptionKey = null;

    // Initialize Winston logger for debugging and error reporting
    this.initializeLogger(logger);

    // Encryption will be initialized in the init method
    this.encryptionInitialized = false;
  }

  /**
   * Initialize the settings manager
   */
  async init() {
    try {
      await this.initializeEncryption();
      this.encryptionInitialized = true;
      this.logger.info('Settings manager initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize settings manager', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Initialize Winston logger
   */
  initializeLogger(logger) {
    if (logger && typeof logger.child === 'function') {
      this.logger = logger.child({
        component: 'settings-manager'
      });
    } else {
      this.logger = (0, _winstonLogger.createWinstonLogger)({
        service: 'pingone-import-settings',
        environment: process.env.NODE_ENV || 'development'
      });
    }
  }

  /**
   * Create a default console logger if none provided
   */
  createDefaultLogger() {
    return {
      log: (msg, level = 'info') => this.logger.log(level, `[Settings] ${msg}`),
      info: msg => this.logger.info(`[Settings] ${msg}`),
      warn: msg => this.logger.warn(`[Settings] ${msg}`),
      error: msg => this.logger.error(`[Settings] ${msg}`),
      debug: msg => this.logger.debug(`[Settings] ${msg}`)
    };
  }

  /**
   * Get region info by code
   * @param {string} code - Region code (e.g., 'NA', 'CA', 'EU', 'AU', 'SG', 'AP')
   * @returns {{code: string, tld: string, label: string}}
   */
  static getRegionInfo(code) {
    const regions = {
      NA: {
        code: 'NA',
        tld: 'com',
        label: 'North America (excluding Canada)'
      },
      CA: {
        code: 'CA',
        tld: 'ca',
        label: 'Canada'
      },
      EU: {
        code: 'EU',
        tld: 'eu',
        label: 'European Union'
      },
      AU: {
        code: 'AU',
        tld: 'com.au',
        label: 'Australia'
      },
      SG: {
        code: 'SG',
        tld: 'sg',
        label: 'Singapore'
      },
      AP: {
        code: 'AP',
        tld: 'asia',
        label: 'Asia-Pacific'
      }
    };
    return regions[code] || regions['NA'];
  }

  /**
   * Get default settings
   */
  getDefaultSettings() {
    return {
      environmentId: '',
      region: 'NA',
      apiClientId: '',
      populationId: '',
      rateLimit: 50,
      connectionStatus: 'disconnected',
      connectionMessage: 'Not connected',
      lastConnectionTest: null,
      autoSave: true,
      lastUsedDirectory: '',
      theme: 'light',
      pageSize: 50,
      showNotifications: true
    };
  }

  /**
   * Load settings from storage
   */
  async loadSettings() {
    try {
      const storedData = localStorage.getItem(this.storageKey);
      if (!storedData) {
        this.logger.info('No stored settings found, using defaults');
        return this.settings;
      }

      // Try to parse as JSON first (unencrypted)
      try {
        const parsedSettings = JSON.parse(storedData);
        this.settings = {
          ...this.getDefaultSettings(),
          ...parsedSettings
        };
        this.logger.info('Settings loaded successfully (unencrypted)', {
          hasEnvironmentId: !!this.settings.environmentId,
          hasApiClientId: !!this.settings.apiClientId,
          region: this.settings.region
        });
        return this.settings;
      } catch (jsonError) {
        // If JSON parsing fails, try decryption
        if (!this.encryptionInitialized) {
          this.logger.warn('Encryption not initialized and JSON parsing failed, using defaults');
          return this.settings;
        }
        try {
          const decryptedData = await _cryptoUtils.CryptoUtils.decrypt(storedData, this.encryptionKey);
          const parsedSettings = JSON.parse(decryptedData);

          // Merge with defaults to ensure all properties exist
          this.settings = {
            ...this.getDefaultSettings(),
            ...parsedSettings
          };
          this.logger.info('Settings loaded successfully (encrypted)', {
            hasEnvironmentId: !!this.settings.environmentId,
            hasApiClientId: !!this.settings.apiClientId,
            region: this.settings.region
          });
          return this.settings;
        } catch (decryptionError) {
          this.logger.error('Failed to decrypt settings', {
            error: decryptionError.message
          });
          // Return default settings on decryption error
          return this.settings;
        }
      }
    } catch (error) {
      this.logger.error('Failed to load settings', {
        error: error.message
      });
      // Return default settings on error
      return this.settings;
    }
  }

  /**
   * Save settings to storage
   */
  async saveSettings(settings = null) {
    try {
      if (settings) {
        this.settings = {
          ...this.settings,
          ...settings
        };
      }

      // Always try to save without encryption first as fallback
      const jsonData = JSON.stringify(this.settings);
      if (!this.encryptionInitialized) {
        this.logger.warn('Encryption not initialized, saving settings without encryption');
        localStorage.setItem(this.storageKey, jsonData);
        this.logger.info('Settings saved successfully (unencrypted)', {
          hasEnvironmentId: !!this.settings.environmentId,
          hasApiClientId: !!this.settings.apiClientId,
          region: this.settings.region
        });
        return;
      }
      try {
        const encryptedData = await _cryptoUtils.CryptoUtils.encrypt(jsonData, this.encryptionKey);
        localStorage.setItem(this.storageKey, encryptedData);
        this.logger.info('Settings saved successfully (encrypted)', {
          hasEnvironmentId: !!this.settings.environmentId,
          hasApiClientId: !!this.settings.apiClientId,
          region: this.settings.region
        });
      } catch (encryptionError) {
        this.logger.warn('Encryption failed, saving settings without encryption', {
          error: encryptionError.message
        });
        // Fallback to unencrypted storage
        localStorage.setItem(this.storageKey, jsonData);
        this.logger.info('Settings saved successfully (unencrypted fallback)', {
          hasEnvironmentId: !!this.settings.environmentId,
          hasApiClientId: !!this.settings.apiClientId,
          region: this.settings.region
        });
      }
    } catch (error) {
      this.logger.error('Failed to save settings', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get a specific setting
   */
  getSetting(key) {
    return this.settings[key];
  }

  /**
   * Set a specific setting
   */
  async setSetting(key, value) {
    try {
      this.settings[key] = value;
      await this.saveSettings();
      this.logger.debug('Setting updated', {
        key,
        value: typeof value === 'string' ? value : '[object]'
      });
    } catch (error) {
      this.logger.error('Failed to update setting', {
        key,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get all settings
   */
  getAllSettings() {
    return {
      ...this.settings
    };
  }

  /**
   * Update multiple settings at once
   */
  async updateSettings(newSettings) {
    try {
      this.settings = {
        ...this.settings,
        ...newSettings
      };
      await this.saveSettings();
      this.logger.info('Multiple settings updated', {
        updatedKeys: Object.keys(newSettings),
        hasEnvironmentId: !!this.settings.environmentId,
        hasApiClientId: !!this.settings.apiClientId
      });
    } catch (error) {
      this.logger.error('Failed to update settings', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Reset settings to defaults
   */
  async resetSettings() {
    try {
      this.settings = this.getDefaultSettings();
      await this.saveSettings();
      this.logger.info('Settings reset to defaults');
    } catch (error) {
      this.logger.error('Failed to reset settings', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Clear all settings
   */
  async clearSettings() {
    try {
      localStorage.removeItem(this.storageKey);
      this.settings = this.getDefaultSettings();
      this.logger.info('Settings cleared');
    } catch (error) {
      this.logger.error('Failed to clear settings', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Initialize encryption with a key derived from browser and user-specific data
   */
  async initializeEncryption() {
    try {
      let deviceId = await this.getDeviceId();
      if (typeof deviceId !== 'string') deviceId = String(deviceId || '');
      if (!deviceId) deviceId = 'fallback-device-id';
      this.encryptionKey = await _cryptoUtils.CryptoUtils.generateKey(deviceId);
      this.logger.debug('Encryption initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize encryption', {
        error: error.message
      });
      // Fallback to a less secure but functional approach
      this.encryptionKey = await _cryptoUtils.CryptoUtils.generateKey('fallback-encryption-key');
      this.logger.warn('Using fallback encryption key');
    }
  }

  /**
   * Generate a device ID based on browser and system information
   * @returns {Promise<string>} A unique device ID
   */
  async getDeviceId() {
    try {
      // Try to get a stored device ID first
      if (this.isLocalStorageAvailable()) {
        const storedDeviceId = localStorage.getItem('pingone-device-id');
        if (storedDeviceId && typeof storedDeviceId === 'string') {
          return storedDeviceId;
        }
      }
      // Generate device ID from browser info
      const navigatorInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: navigator.deviceMemory,
        maxTouchPoints: navigator.maxTouchPoints
      };
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify(navigatorInfo));
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const deviceId = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      if (typeof deviceId !== 'string' || !deviceId) return 'fallback-device-id';
      return deviceId;
    } catch (error) {
      this.logger.error('Failed to generate device ID:', error);
      // Fallback to a random string if crypto API fails
      return 'fallback-' + Math.random().toString(36).substring(2, 15);
    }
  }

  /**
   * Check if localStorage is available
   */
  isLocalStorageAvailable() {
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      this.logger.warn('localStorage not available', {
        error: error.message
      });
      return false;
    }
  }

  /**
   * Export settings (for backup)
   */
  async exportSettings() {
    try {
      const exportData = {
        settings: this.settings,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      this.logger.info('Settings exported', {
        exportDate: exportData.exportDate
      });
      return exportData;
    } catch (error) {
      this.logger.error('Failed to export settings', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Import settings (from backup)
   */
  async importSettings(importData) {
    try {
      if (!importData.settings) {
        throw new Error('Invalid import data: missing settings');
      }
      this.settings = {
        ...this.getDefaultSettings(),
        ...importData.settings
      };
      await this.saveSettings();
      this.logger.info('Settings imported successfully', {
        importDate: importData.exportDate,
        hasEnvironmentId: !!this.settings.environmentId,
        hasApiClientId: !!this.settings.apiClientId
      });
    } catch (error) {
      this.logger.error('Failed to import settings', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Debug method to check localStorage contents
   */
  debugLocalStorage() {
    try {
      const storedData = localStorage.getItem(this.storageKey);
      if (!storedData) {
        this.logger.info('No data found in localStorage', {
          key: this.storageKey
        });
        return null;
      }
      this.logger.info('localStorage contents found', {
        key: this.storageKey,
        length: storedData.length,
        preview: storedData.substring(0, 100) + (storedData.length > 100 ? '...' : '')
      });

      // Try to parse as JSON
      try {
        const parsed = JSON.parse(storedData);
        this.logger.info('Data is valid JSON', {
          keys: Object.keys(parsed),
          hasEnvironmentId: !!parsed.environmentId,
          hasApiClientId: !!parsed.apiClientId
        });
        return parsed;
      } catch (jsonError) {
        this.logger.info('Data is not valid JSON, likely encrypted', {
          error: jsonError.message
        });
        return 'encrypted';
      }
    } catch (error) {
      this.logger.error('Failed to debug localStorage', {
        error: error.message
      });
      return null;
    }
  }
}

// Export the SettingsManager class
exports.SettingsManager = SettingsManager;

}).call(this)}).call(this,require('_process'))
},{"./crypto-utils.js":42,"./winston-logger.js":60,"_process":25}],56:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.clearTokenAlertSession = clearTokenAlertSession;
exports.showTokenAlertModal = showTokenAlertModal;
// Token Alert Modal - blocks interaction and guides user to settings if no valid token is available
class TokenAlertModal {
  constructor({
    tokenStatus = '',
    expiry = '',
    operation = ''
  } = {}) {
    if (TokenAlertModal.hasShownThisSession()) return;
    TokenAlertModal.setShownThisSession();
    this.operation = operation;
    this.createModal(tokenStatus, expiry);
    this.showModal();
  }
  createModal(tokenStatus, expiry) {
    // Overlay
    const overlay = document.createElement('div');
    overlay.className = 'token-alert-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'token-alert-title');
    overlay.setAttribute('aria-describedby', 'token-alert-content');

    // Modal content with enhanced styling and action button
    overlay.innerHTML = `
            <div class="token-alert-modal" tabindex="-1">
                <div class="token-alert-header">
                    <h2 id="token-alert-title">
                        <span class="warning-icon" aria-hidden="true">⚠️</span>
                        <span>Authentication Required</span>
                    </h2>
                    <button type="button" class="token-alert-close" id="token-alert-close" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="token-alert-body">
                    <div id="token-alert-content" class="token-alert-content">
                        <div class="token-alert-icon">
                            <span aria-hidden="true">🔐</span>
                        </div>
                        <h3>No Valid Token Available</h3>
                        <p class="token-alert-message">
                            <strong>Authentication is required to continue.</strong>
                            ${this.operation ? `You need valid credentials to perform the "${this.operation}" operation.` : 'You need valid credentials to use this application.'}
                        </p>
                        ${tokenStatus || expiry ? `<div class="token-status-info">
                            <p><strong>Current Status:</strong> ${tokenStatus ? tokenStatus : 'No token available'}</p>
                            ${expiry ? `<p><strong>Token Expired:</strong> ${expiry}</p>` : ''}
                        </div>` : ''}
                        <div class="token-alert-actions">
                            <button type="button" class="btn btn-primary btn-lg" id="token-alert-settings-btn">
                                <span class="btn-icon">⚙️</span>
                                Go to Settings
                            </button>
                            <p class="token-alert-help">
                                Add your PingOne credentials in the Settings page to generate a new token.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    document.body.appendChild(overlay);
    this.overlay = overlay;
    this.modal = overlay.querySelector('.token-alert-modal');
    this.settingsBtn = overlay.querySelector('#token-alert-settings-btn');
    this.closeBtn = overlay.querySelector('#token-alert-close');
    this.bindEvents();
  }
  bindEvents() {
    // Settings button - navigate to settings
    this.settingsBtn.addEventListener('click', () => {
      this.hideModal();
      // Navigate to settings view within the SPA instead of redirecting
      if (window.app && window.app.showView) {
        window.app.showView('settings');
      } else {
        // Fallback: navigate to settings view by triggering the settings nav item
        const settingsNavItem = document.querySelector('[data-view="settings"]');
        if (settingsNavItem) {
          settingsNavItem.click();
        } else {
          // Final fallback: redirect to home page which will show settings
          window.location.href = '/';
        }
      }
    });

    // Close button - allow manual dismissal
    this.closeBtn.addEventListener('click', () => {
      this.hideModal();
    });

    // Trap focus within modal
    this.overlay.addEventListener('keydown', e => this.handleKeyboardNavigation(e));

    // Prevent closing by outside click (modal should be persistent)
    this.overlay.addEventListener('click', e => {
      if (e.target === this.overlay) {
        e.preventDefault();
        // Don't close on outside click - keep modal visible
      }
    });

    // Prevent escape key from closing modal (should be persistent)
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        e.preventDefault();
        // Don't close on escape - keep modal visible
      }
    });
  }
  handleKeyboardNavigation(e) {
    const focusable = this.modal.querySelectorAll('button, [tabindex]:not([tabindex="-1"])');
    if (e.key === 'Tab') {
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }
  showModal() {
    document.body.classList.add('token-alert-open');
    this.overlay.classList.add('active');
    this.modal.focus();

    // Add styles to body to prevent scrolling
    document.body.style.overflow = 'hidden';
  }
  hideModal() {
    this.overlay.classList.remove('active');
    document.body.classList.remove('token-alert-open');
    document.body.style.overflow = '';
    setTimeout(() => {
      if (this.overlay && this.overlay.parentNode) {
        this.overlay.parentNode.removeChild(this.overlay);
      }
    }, 300);
  }
  static hasShownThisSession() {
    return sessionStorage.getItem('tokenAlertModalShown') === 'true';
  }
  static setShownThisSession() {
    sessionStorage.setItem('tokenAlertModalShown', 'true');
  }
  static clearShownThisSession() {
    sessionStorage.removeItem('tokenAlertModalShown');
  }
}

// Export a function to show the modal
function showTokenAlertModal({
  tokenStatus = '',
  expiry = '',
  operation = ''
} = {}) {
  new TokenAlertModal({
    tokenStatus,
    expiry,
    operation
  });
}

// Export function to clear the session flag (useful for testing)
function clearTokenAlertSession() {
  TokenAlertModal.clearShownThisSession();
}

},{}],57:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
/**
 * TokenManager - Handles OAuth 2.0 token acquisition and caching with automatic re-authentication
 * 
 * Features:
 * - Automatic token refresh before expiry
 * - Detection of token expiration via 401 responses
 * - Automatic retry of failed requests with new tokens
 * - Secure credential storage and retrieval
 * - Rate limiting to prevent API abuse
 */
class TokenManager {
  /**
   * Create a new TokenManager instance
   * @param {Object} logger - Logger instance for logging messages
   * @param {Object} settings - Settings object containing API credentials
   */
  constructor(logger, settings) {
    this.logger = logger || console;
    this.settings = settings || {};
    this.tokenCache = {
      accessToken: null,
      expiresAt: 0,
      tokenType: 'Bearer',
      lastRefresh: 0
    };
    this.tokenExpiryBuffer = 5 * 60 * 1000; // 5 minutes buffer before token expiry
    this.isRefreshing = false;
    this.refreshQueue = [];

    // Auto-retry configuration
    this.maxRetries = 1; // Only retry once with new token
    this.retryDelay = 1000; // 1 second delay before retry

    // Bind methods
    this.getAccessToken = this.getAccessToken.bind(this);
    this._requestNewToken = this._requestNewToken.bind(this);
    this._isTokenValid = this._isTokenValid.bind(this);
    this.handleTokenExpiration = this.handleTokenExpiration.bind(this);
    this.retryWithNewToken = this.retryWithNewToken.bind(this);
  }

  /**
   * Get a valid access token, either from cache or by requesting a new one
   * @returns {Promise<string>} The access token
   */
  async getAccessToken() {
    // Check if we have a valid cached token
    if (this._isTokenValid()) {
      this.logger.debug('Using cached access token');
      return this.tokenCache.accessToken;
    }

    // If a refresh is already in progress, queue this request
    if (this.isRefreshing) {
      return new Promise(resolve => {
        this.refreshQueue.push(resolve);
      });
    }

    // Otherwise, request a new token
    try {
      this.isRefreshing = true;
      const token = await this._requestNewToken();

      // Resolve all queued requests
      while (this.refreshQueue.length > 0) {
        const resolve = this.refreshQueue.shift();
        resolve(token);
      }
      return token;
    } catch (error) {
      // Clear token cache on error
      this.tokenCache = {
        accessToken: null,
        expiresAt: 0,
        tokenType: 'Bearer',
        lastRefresh: 0
      };

      // Reject all queued requests
      while (this.refreshQueue.length > 0) {
        const resolve = this.refreshQueue.shift();
        resolve(Promise.reject(error));
      }
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Handle token expiration detected from API response
   * @param {Object} response - The failed API response
   * @param {Function} retryFn - Function to retry the original request
   * @returns {Promise<Object>} The retry result
   */
  async handleTokenExpiration(response, retryFn) {
    this.logger.warn('Token expiration detected, attempting automatic re-authentication');

    // Clear the expired token
    this.tokenCache = {
      accessToken: null,
      expiresAt: 0,
      tokenType: 'Bearer',
      lastRefresh: 0
    };
    try {
      // Get a new token using stored credentials
      const newToken = await this.getAccessToken();
      if (!newToken) {
        throw new Error('Failed to obtain new token for retry');
      }
      this.logger.info('Successfully obtained new token, retrying request');

      // Wait a moment before retrying to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, this.retryDelay));

      // Retry the original request with the new token
      return await retryFn(newToken);
    } catch (error) {
      this.logger.error('Failed to re-authenticate and retry request', {
        error: error.message,
        originalStatus: response.status
      });
      throw error;
    }
  }

  /**
   * Retry a failed request with a new token
   * @param {Function} requestFn - Function that makes the API request
   * @param {Object} options - Request options
   * @returns {Promise<Object>} The API response
   */
  async retryWithNewToken(requestFn, options = {}) {
    let retryCount = 0;
    while (retryCount <= this.maxRetries) {
      try {
        // Get current token
        const token = await this.getAccessToken();

        // Make the request
        const response = await requestFn(token);

        // Check if the response indicates token expiration
        if (response.status === 401) {
          const responseText = await response.text().catch(() => '');
          const isTokenExpired = responseText.includes('token_expired') || responseText.includes('invalid_token') || responseText.includes('expired');
          if (isTokenExpired && retryCount < this.maxRetries) {
            this.logger.warn(`Token expired on attempt ${retryCount + 1}, retrying with new token`);

            // Clear expired token and get new one
            this.tokenCache = {
              accessToken: null,
              expiresAt: 0,
              tokenType: 'Bearer',
              lastRefresh: 0
            };
            retryCount++;
            continue;
          }
        }

        // If we get here, the request was successful or we've exhausted retries
        return response;
      } catch (error) {
        if (retryCount >= this.maxRetries) {
          throw error;
        }
        this.logger.warn(`Request failed on attempt ${retryCount + 1}, retrying`, {
          error: error.message
        });
        retryCount++;

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }
    throw new Error('Max retries exceeded');
  }

  /**
   * Create a request wrapper that automatically handles token expiration
   * @param {Function} requestFn - Function that makes the API request
   * @returns {Function} Wrapped function that handles token expiration
   */
  createAutoRetryWrapper(requestFn) {
    return async (...args) => {
      return await this.retryWithNewToken(async token => {
        // Add the token to the request arguments
        const requestArgs = [...args];

        // If the first argument is an options object, add the token to it
        if (requestArgs[0] && typeof requestArgs[0] === 'object') {
          requestArgs[0].headers = {
            ...requestArgs[0].headers,
            'Authorization': `Bearer ${token}`
          };
        }
        return await requestFn(...requestArgs);
      });
    };
  }

  /**
   * Get token information including expiry details
   * @returns {Object|null} Token info object or null if no token
   */
  getTokenInfo() {
    if (!this.tokenCache.accessToken) {
      return null;
    }
    const now = Date.now();
    const expiresIn = Math.max(0, this.tokenCache.expiresAt - now);
    return {
      accessToken: this.tokenCache.accessToken,
      expiresIn: Math.floor(expiresIn / 1000),
      // Convert to seconds
      tokenType: this.tokenCache.tokenType,
      expiresAt: this.tokenCache.expiresAt,
      lastRefresh: this.tokenCache.lastRefresh,
      isValid: this._isTokenValid()
    };
  }

  /**
   * Check if the current token is still valid
   * @returns {boolean} True if token is valid, false otherwise
   * @private
   */
  _isTokenValid() {
    const now = Date.now();
    return this.tokenCache.accessToken && this.tokenCache.expiresAt > now + this.tokenExpiryBuffer &&
    // Ensure token isn't too old (max 1 hour)
    now - this.tokenCache.lastRefresh < 60 * 60 * 1000;
  }

  /**
   * Get the auth domain for a given region
   * @private
   */
  _getAuthDomain(region) {
    const authDomainMap = {
      'NorthAmerica': 'auth.pingone.com',
      'Europe': 'auth.eu.pingone.com',
      'Canada': 'auth.ca.pingone.com',
      'Asia': 'auth.apsoutheast.pingone.com',
      'Australia': 'auth.aus.pingone.com',
      'US': 'auth.pingone.com',
      'EU': 'auth.eu.pingone.com',
      'AP': 'auth.apsoutheast.pingone.com'
    };
    return authDomainMap[region] || 'auth.pingone.com';
  }

  /**
   * Request a new access token from PingOne using stored credentials
   * @returns {Promise<string>} The new access token
   * @private
   */
  async _requestNewToken() {
    const {
      apiClientId,
      apiSecret,
      environmentId,
      region = 'NorthAmerica'
    } = this.settings;
    const requestId = `req_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    // Validate required settings
    if (!apiClientId || !apiSecret || !environmentId) {
      const error = new Error('Missing required API credentials in settings');
      this.logger.error('Token request failed: Missing credentials', {
        requestId,
        hasClientId: !!apiClientId,
        hasSecret: !!apiSecret,
        hasEnvId: !!environmentId
      });
      throw error;
    }

    // Prepare request
    const authDomain = this._getAuthDomain(region);
    const tokenUrl = `https://${authDomain}/${environmentId}/as/token`;
    const credentials = btoa(`${apiClientId}:${apiSecret}`);
    try {
      this.logger.debug('Requesting new access token from PingOne...', {
        requestId,
        authDomain,
        environmentId,
        region
      });
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`
        },
        body: 'grant_type=client_credentials',
        credentials: 'omit'
      });
      const responseTime = Date.now() - startTime;
      let responseData;
      try {
        responseData = await response.json();
      } catch (e) {
        const text = await response.text().catch(() => 'Failed to read response text');
        throw new Error(`Invalid JSON response: ${e.message}. Response: ${text}`);
      }
      if (!response.ok) {
        const errorMsg = responseData.error_description || responseData.error || `HTTP ${response.status} ${response.statusText}`;
        this.logger.error('Token request failed', {
          requestId,
          status: response.status,
          error: responseData.error,
          errorDescription: responseData.error_description,
          responseTime: `${responseTime}ms`,
          url: tokenUrl
        });
        throw new Error(errorMsg);
      }
      if (!responseData.access_token) {
        throw new Error('No access token in response');
      }

      // Update token cache
      const expiresInMs = (responseData.expires_in || 3600) * 1000;
      this.tokenCache = {
        accessToken: responseData.access_token,
        expiresAt: Date.now() + expiresInMs,
        tokenType: responseData.token_type || 'Bearer',
        lastRefresh: Date.now()
      };
      this.logger.info('Successfully obtained new access token', {
        requestId,
        tokenType: this.tokenCache.tokenType,
        expiresIn: Math.floor(expiresInMs / 1000) + 's',
        responseTime: `${responseTime}ms`
      });
      return this.tokenCache.accessToken;
    } catch (error) {
      this.logger.error('Error getting access token', {
        requestId,
        error: error.toString(),
        message: error.message,
        url: tokenUrl,
        responseTime: `${Date.now() - startTime}ms`
      });

      // Clear token cache on error
      this.tokenCache = {
        accessToken: null,
        expiresAt: 0,
        tokenType: 'Bearer',
        lastRefresh: 0
      };
      throw error;
    }
  }

  /**
   * Update settings and clear token cache if credentials changed
   * @param {Object} newSettings - New settings object
   */
  updateSettings(newSettings) {
    const credentialsChanged = newSettings.apiClientId !== this.settings.apiClientId || newSettings.apiSecret !== this.settings.apiSecret || newSettings.environmentId !== this.settings.environmentId || newSettings.region !== this.settings.region;
    this.settings = {
      ...this.settings,
      ...newSettings
    };
    if (credentialsChanged) {
      this.logger.debug('API credentials changed, clearing token cache');
      this.tokenCache = {
        accessToken: null,
        expiresAt: 0,
        tokenType: 'Bearer',
        lastRefresh: 0
      };
    }
  }
}
var _default = exports.default = TokenManager;

},{}],58:[function(require,module,exports){
(function (process){(function (){
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.uiManager = exports.UIManager = void 0;
var _winstonLogger = require("./winston-logger.js");
var _circularProgress = require("./circular-progress.js");
var _elementRegistry = require("./element-registry.js");
var _progressManager = _interopRequireDefault(require("./progress-manager.js"));
// File: ui-manager.js
// Description: UI management for PingOne user import tool
// 
// This module handles all user interface interactions and state management:
// - Status notifications and user feedback
// - Progress tracking and real-time updates
// - View transitions and navigation
// - Debug logging and error display
// - Connection status indicators
// - Form handling and validation feedback
// 
// Provides a centralized interface for updating the UI based on application events.

// Enable debug mode for development (set to false in production)
const DEBUG_MODE = true;

/**
 * UI Manager Class
 * 
 * Manages all user interface interactions and updates with Winston logging.
 */
class UIManager {
  constructor() {
    // Initialize Winston logger
    this.logger = (0, _winstonLogger.createWinstonLogger)({
      service: 'pingone-import-ui',
      environment: process.env.NODE_ENV || 'development'
    });
    this.notificationContainer = null;
    this.progressContainer = null;
    this.tokenStatusElement = null;
    this.connectionStatusElement = null;
    this.initialize();
  }

  /**
   * Initialize UI manager
   */
  initialize() {
    try {
      this.setupElements();
      this.logger.info('UI Manager initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize UI Manager', {
        error: error.message
      });
    }
  }

  /**
   * Initialize UI manager (alias for initialize for compatibility)
   */
  async init() {
    this.initialize();
    return Promise.resolve();
  }

  /**
   * Setup UI elements
   */
  setupElements() {
    try {
      // Initialize core UI elements with safe fallbacks
      this.notificationContainer = _elementRegistry.ElementRegistry.notificationContainer ? _elementRegistry.ElementRegistry.notificationContainer() : null;
      this.progressContainer = _elementRegistry.ElementRegistry.progressContainer ? _elementRegistry.ElementRegistry.progressContainer() : null;
      this.tokenStatusElement = _elementRegistry.ElementRegistry.tokenStatus ? _elementRegistry.ElementRegistry.tokenStatus() : null;
      this.connectionStatusElement = _elementRegistry.ElementRegistry.connectionStatus ? _elementRegistry.ElementRegistry.connectionStatus() : null;

      // Initialize navigation items for safe access
      this.navItems = document.querySelectorAll('[data-view]');
      if (!this.notificationContainer) {
        this.logger.warn('Notification container not found');
      }
      if (!this.progressContainer) {
        this.logger.warn('Progress container not found');
      }
      this.logger.debug('UI elements setup completed', {
        hasNotificationContainer: !!this.notificationContainer,
        hasProgressContainer: !!this.progressContainer,
        hasTokenStatusElement: !!this.tokenStatusElement,
        hasConnectionStatusElement: !!this.connectionStatusElement,
        navItemsCount: this.navItems ? this.navItems.length : 0
      });
    } catch (error) {
      this.logger.error('Error setting up UI elements', {
        error: error.message
      });
    }
  }

  /**
   * Show a persistent, animated status bar message
   * type: info, success, warning, error
   * message: string
   * options: { autoDismiss: boolean, duration: ms }
   */
  showStatusBar(message, type = 'info', options = {}) {
    const bar = _elementRegistry.ElementRegistry.statusBar ? _elementRegistry.ElementRegistry.statusBar() : null;
    if (!bar) {
      this.logger.warn('Status bar element not found');
      return;
    }

    // Clear any existing auto-dismiss timers
    if (this.statusBarTimer) {
      clearTimeout(this.statusBarTimer);
      this.statusBarTimer = null;
    }

    // Remove previous content and classes
    bar.className = 'status-bar';
    bar.innerHTML = '';

    // Create icon element
    const icon = document.createElement('span');
    icon.className = 'status-icon';
    icon.innerHTML = {
      info: '<i class="fas fa-info-circle"></i>',
      success: '<i class="fas fa-check-circle"></i>',
      warning: '<i class="fas fa-exclamation-triangle"></i>',
      error: '<i class="fas fa-times-circle"></i>'
    }[type] || '<i class="fas fa-info-circle"></i>';
    bar.appendChild(icon);

    // Create message element
    const msg = document.createElement('span');
    msg.className = 'status-message';
    msg.textContent = message;
    bar.appendChild(msg);

    // Add dismiss button for error/warning (persistent messages)
    if (type === 'error' || type === 'warning') {
      const dismiss = document.createElement('button');
      dismiss.className = 'status-dismiss';
      dismiss.innerHTML = '&times;';
      dismiss.setAttribute('aria-label', 'Dismiss message');
      dismiss.onclick = () => this.clearStatusBar();
      bar.appendChild(dismiss);
    }

    // Animate in with a slight delay for smooth transition
    setTimeout(() => {
      bar.classList.add('visible', type);
    }, 10);

    // Auto-dismiss for success/info messages
    const shouldAutoDismiss = options.autoDismiss !== false && (type === 'success' || type === 'info');
    if (shouldAutoDismiss) {
      const duration = options.duration || (type === 'success' ? 4000 : 3000);
      this.statusBarTimer = setTimeout(() => {
        this.clearStatusBar();
      }, duration);
    }

    // Log the status bar message
    this.logger.info('Status bar message shown', {
      type,
      message: message.substring(0, 100),
      autoDismiss: shouldAutoDismiss,
      duration: options.duration
    });
  }

  /**
   * Clear the status bar with smooth animation
   */
  clearStatusBar() {
    const bar = _elementRegistry.ElementRegistry.statusBar ? _elementRegistry.ElementRegistry.statusBar() : null;
    if (!bar) return;

    // Clear any pending timers
    if (this.statusBarTimer) {
      clearTimeout(this.statusBarTimer);
      this.statusBarTimer = null;
    }

    // Remove visible class to trigger fade out animation
    bar.classList.remove('visible');

    // Clear content after animation completes
    setTimeout(() => {
      bar.innerHTML = '';
      bar.className = 'status-bar';
    }, 400);
    this.logger.debug('Status bar cleared');
  }

  /**
   * Show a temporary success message with auto-dismiss
   */
  showSuccess(message, details = '') {
    this.showStatusBar(message, 'success', {
      autoDismiss: true,
      duration: 4000
    });
    if (details) {
      this.logger.info('Success notification with details', {
        message,
        details
      });
    } else {
      this.logger.info('Success notification shown', {
        message
      });
    }
  }

  /**
   * Show an error message that stays until dismissed
   */
  showError(title, message) {
    const fullMessage = title && message ? `${title}: ${message}` : title || message;
    this.showStatusBar(fullMessage, 'error', {
      autoDismiss: false
    });
    this.logger.error('Error notification shown', {
      title,
      message
    });
  }

  /**
   * Show a warning message that stays until dismissed
   */
  showWarning(message) {
    this.showStatusBar(message, 'warning', {
      autoDismiss: false
    });
    this.logger.warn('Warning notification shown', {
      message
    });
  }

  /**
   * Show an info message with auto-dismiss
   */
  showInfo(message) {
    this.showStatusBar(message, 'info', {
      autoDismiss: true,
      duration: 3000
    });
    this.logger.info('Info notification shown', {
      message
    });
  }

  /**
   * Show a loading message that stays until cleared
   */
  showLoading(message = 'Processing...') {
    this.showStatusBar(message, 'info', {
      autoDismiss: false
    });
    this.logger.info('Loading notification shown', {
      message
    });
  }

  /**
   * Clear loading state and show completion message
   */
  hideLoading(successMessage = null) {
    this.clearStatusBar();
    if (successMessage) {
      this.showSuccess(successMessage);
    }
  }

  /**
   * Update progress with Winston logging
   */
  updateProgress(current, total, message = '') {
    try {
      const percentage = total > 0 ? Math.round(current / total * 100) : 0;
      this.logger.debug('Progress updated', {
        current,
        total,
        percentage,
        message: message.substring(0, 50)
      });
      if (this.progressContainer) {
        const progressBar = this.progressContainer.querySelector('.progress-bar');
        const progressText = this.progressContainer.querySelector('.progress-text');
        if (progressBar) {
          progressBar.style.width = `${percentage}%`;
        }
        if (progressText) {
          progressText.textContent = message || `${current} of ${total} (${percentage}%)`;
        }
      }
    } catch (error) {
      this.logger.error('Error updating progress', {
        error: error.message,
        current,
        total
      });
    }
  }

  /**
   * Update token status with Winston logging
   */
  updateTokenStatus(status, message = '') {
    try {
      this.logger.info('Token status updated', {
        status,
        message
      });
      if (this.tokenStatusElement) {
        this.tokenStatusElement.className = `token-status ${status}`;
        this.tokenStatusElement.textContent = message || status;
      } else {
        this.logger.warn('Token status element not found');
      }
    } catch (error) {
      this.logger.error('Error updating token status', {
        error: error.message,
        status,
        message
      });
    }
  }

  /**
   * Update connection status with Winston logging
   */
  updateConnectionStatus(status, message = '') {
    try {
      this.logger.info('Connection status updated', {
        status,
        message
      });
      if (this.connectionStatusElement) {
        this.connectionStatusElement.className = `connection-status ${status}`;
        this.connectionStatusElement.textContent = message || status;
      } else {
        this.logger.warn('Connection status element not found');
      }
    } catch (error) {
      this.logger.error('Error updating connection status', {
        error: error.message,
        status,
        message
      });
    }
  }

  /**
   * Show current token status with Winston logging
   */
  showCurrentTokenStatus(tokenInfo) {
    try {
      this.logger.debug('Showing current token status', {
        hasToken: !!tokenInfo.token,
        timeRemaining: tokenInfo.timeRemaining,
        isExpired: tokenInfo.isExpired
      });
      const statusElement = _elementRegistry.ElementRegistry.currentTokenStatus ? _elementRegistry.ElementRegistry.currentTokenStatus() : null;
      if (statusElement) {
        if (tokenInfo.isExpired) {
          statusElement.className = 'token-status expired';
          statusElement.textContent = 'Token expired';
        } else if (tokenInfo.token) {
          statusElement.className = 'token-status valid';
          statusElement.textContent = `Token valid (${tokenInfo.timeRemaining})`;
        } else {
          statusElement.className = 'token-status none';
          statusElement.textContent = 'No token available';
        }
      } else {
        this.logger.warn('Current token status element not found');
      }
    } catch (error) {
      this.logger.error('Error showing current token status', {
        error: error.message,
        tokenInfo
      });
    }
  }

  /**
   * Update universal token status with Winston logging
   */
  updateUniversalTokenStatus(tokenInfo) {
    try {
      this.logger.debug('Universal token status updated', {
        hasToken: !!tokenInfo.token,
        timeRemaining: tokenInfo.timeRemaining
      });
      const universalStatusBar = _elementRegistry.ElementRegistry.universalTokenStatus ? _elementRegistry.ElementRegistry.universalTokenStatus() : null;
      if (universalStatusBar) {
        if (tokenInfo.isExpired) {
          universalStatusBar.className = 'universal-token-status expired';
          universalStatusBar.textContent = '🔴 Token Expired';
        } else if (tokenInfo.token) {
          universalStatusBar.className = 'universal-token-status valid';
          universalStatusBar.textContent = `🟢 Token Valid (${tokenInfo.timeRemaining})`;
        } else {
          universalStatusBar.className = 'universal-token-status none';
          universalStatusBar.textContent = '⚪ No Token';
        }
      } else {
        this.logger.warn('Universal token status bar not found');
      }
    } catch (error) {
      this.logger.error('Error updating universal token status', {
        error: error.message,
        tokenInfo
      });
    }
  }

  /**
   * Update home token status with Winston logging
   */
  updateHomeTokenStatus(isLoading = false) {
    try {
      this.logger.debug('Home token status updated', {
        isLoading
      });
      const homeTokenStatus = _elementRegistry.ElementRegistry.homeTokenStatus ? _elementRegistry.ElementRegistry.homeTokenStatus() : null;
      if (homeTokenStatus) {
        if (isLoading) {
          homeTokenStatus.className = 'home-token-status loading';
          homeTokenStatus.textContent = '🔄 Checking token...';
        } else {
          homeTokenStatus.className = 'home-token-status ready';
          homeTokenStatus.textContent = '✅ Token ready';
        }
      } else {
        this.logger.warn('Home token status element not found');
      }
    } catch (error) {
      this.logger.error('Error updating home token status', {
        error: error.message,
        isLoading
      });
    }
  }

  /**
   * Update settings save status with Winston logging
   */
  updateSettingsSaveStatus(success, message = '') {
    try {
      this.logger.info('Settings save status updated', {
        success,
        message
      });
      const saveStatusElement = _elementRegistry.ElementRegistry.settingsSaveStatus ? _elementRegistry.ElementRegistry.settingsSaveStatus() : null;
      if (saveStatusElement) {
        if (success) {
          saveStatusElement.className = 'settings-save-status success';
          saveStatusElement.textContent = '✅ Settings saved successfully';
        } else {
          saveStatusElement.className = 'settings-save-status error';
          saveStatusElement.textContent = `❌ ${message || 'Failed to save settings'}`;
        }
      } else {
        this.logger.warn('Settings save status element not found');
      }
    } catch (error) {
      this.logger.error('Error updating settings save status', {
        error: error.message,
        success,
        message
      });
    }
  }

  /**
   * Show enhanced settings action status
   * @param {string} message - Status message
   * @param {string} type - Status type (success, error, warning, info)
   * @param {Object} options - Additional options
   */
  showSettingsActionStatus(message, type = 'info', options = {}) {
    try {
      this.logger.info('Settings action status shown', {
        message,
        type,
        options
      });
      const statusElement = document.getElementById('settings-action-status');
      const statusIcon = statusElement?.querySelector('.status-icon');
      const statusMessage = statusElement?.querySelector('.status-message');
      const closeButton = statusElement?.querySelector('.status-close');
      if (!statusElement || !statusIcon || !statusMessage) {
        this.logger.warn('Settings action status elements not found');
        return;
      }

      // Set icon based on type
      const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
      };
      statusIcon.textContent = icons[type] || icons.info;

      // Set message
      statusMessage.textContent = message;

      // Update classes
      statusElement.className = `action-status ${type}`;
      statusElement.style.display = 'block';

      // Setup close button
      if (closeButton) {
        closeButton.onclick = () => {
          this.hideSettingsActionStatus();
        };
      }

      // Auto-hide if specified
      if (options.autoHide !== false) {
        const autoHideDelay = options.autoHideDelay || 5000; // 5 seconds default
        setTimeout(() => {
          this.hideSettingsActionStatus();
        }, autoHideDelay);
      }
    } catch (error) {
      this.logger.error('Error showing settings action status', {
        error: error.message,
        message,
        type,
        options
      });
    }
  }

  /**
   * Hide settings action status
   */
  hideSettingsActionStatus() {
    try {
      const statusElement = document.getElementById('settings-action-status');
      if (statusElement) {
        statusElement.classList.add('auto-hide');
        setTimeout(() => {
          statusElement.style.display = 'none';
          statusElement.classList.remove('auto-hide');
        }, 300);
      }
    } catch (error) {
      this.logger.error('Error hiding settings action status', {
        error: error.message
      });
    }
  }

  /**
   * Show import status with Winston logging
   */
  showImportStatus(status, message = '', details = {}) {
    try {
      this.logger.info('Import status shown', {
        status,
        message,
        details
      });
      const statusElement = _elementRegistry.ElementRegistry.importStatus ? _elementRegistry.ElementRegistry.importStatus() : null;
      if (statusElement) {
        statusElement.className = `import-status ${status}`;
        statusElement.textContent = message;

        // Add details if provided
        if (Object.keys(details).length > 0) {
          const detailsElement = document.createElement('div');
          detailsElement.className = 'import-details';
          detailsElement.textContent = JSON.stringify(details, null, 2);
          statusElement.appendChild(detailsElement);
        }
      } else {
        this.logger.warn('Import status element not found');
      }
    } catch (error) {
      this.logger.error('Error showing import status', {
        error: error.message,
        status,
        message
      });
    }
  }

  /**
   * Clear all notifications
   */
  clearNotifications() {
    try {
      if (this.notificationContainer) {
        this.notificationContainer.innerHTML = '';
        this.logger.debug('All notifications cleared');
      }
    } catch (error) {
      this.logger.error('Error clearing notifications', {
        error: error.message
      });
    }
  }

  /**
   * Hide progress
   */
  hideProgress() {
    try {
      if (this.progressContainer) {
        this.progressContainer.style.display = 'none';
        this.logger.debug('Progress hidden');
      }
    } catch (error) {
      this.logger.error('Error hiding progress', {
        error: error.message
      });
    }
  }

  /**
   * Show progress
   */
  showProgress() {
    try {
      if (this.progressContainer) {
        this.progressContainer.style.display = 'block';
        this.logger.debug('Progress shown');
      }
    } catch (error) {
      this.logger.error('Error showing progress', {
        error: error.message
      });
    }
  }

  /**
   * Set button loading state
   */
  setButtonLoading(buttonId, isLoading) {
    try {
      const button = document.getElementById(buttonId);
      if (button) {
        if (isLoading) {
          button.disabled = true;
          button.innerHTML = '<span class="spinner"></span> Loading...';
        } else {
          button.disabled = false;
          button.innerHTML = button.getAttribute('data-original-text') || 'Submit';
        }
        this.logger.debug('Button loading state updated', {
          buttonId,
          isLoading
        });
      } else {
        this.logger.warn(`Button with ID '${buttonId}' not found`);
      }
    } catch (error) {
      this.logger.error('Error setting button loading state', {
        error: error.message,
        buttonId,
        isLoading
      });
    }
  }

  /**
   * Update population fields with Winston logging
   */
  updatePopulationFields(populations) {
    try {
      this.logger.debug('Population fields updated', {
        populationCount: populations.length,
        populationNames: populations.map(p => p.name)
      });
      const populationSelect = document.getElementById('import-population-select');
      if (populationSelect) {
        populationSelect.innerHTML = '<option value="">Select Population</option>';
        populations.forEach(population => {
          const option = document.createElement('option');
          option.value = population.id;
          option.textContent = population.name;
          populationSelect.appendChild(option);
        });
      } else {
        this.logger.warn('Population select element not found');
      }
    } catch (error) {
      this.logger.error('Error updating population fields', {
        error: error.message,
        populations
      });
    }
  }

  /**
   * Show a notification message
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, error, warning, info)
   * @param {Object} options - Additional options
   */
  showNotification(title, message, type = 'info', options = {}) {
    try {
      // Use existing methods based on type
      switch (type) {
        case 'success':
          this.showSuccess(message);
          break;
        case 'error':
          this.showError(title, message);
          break;
        case 'warning':
          this.showWarning(message);
          break;
        case 'info':
        default:
          this.showInfo(message);
          break;
      }
      this.logger.info('Notification shown', {
        title,
        message,
        type
      });
    } catch (error) {
      this.logger.error('Failed to show notification', {
        error: error.message,
        title,
        message,
        type
      });
      // Fallback to console
      console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
    }
  }

  /**
   * Update import progress with enhanced functionality
   * 
   * @param {number} current - Current progress
   * @param {number} total - Total items
   * @param {string} message - Progress message
   * @param {Object} counts - Progress counts
   * @param {string} populationName - Population name
   * @param {string} populationId - Population ID
   */
  updateImportProgress(current, total, message = '', counts = {}, populationName = '', populationId = '') {
    try {
      // Use the progress manager for enhanced progress handling
      _progressManager.default.updateProgress(current, total, message, {
        ...counts,
        population: populationName,
        populationId: populationId
      });

      // Update operation stats
      if (counts.success !== undefined) _progressManager.default.operationStats.success = counts.success;
      if (counts.failed !== undefined) _progressManager.default.operationStats.failed = counts.failed;
      if (counts.skipped !== undefined) _progressManager.default.operationStats.skipped = counts.skipped;
      if (counts.duplicates !== undefined) _progressManager.default.operationStats.duplicates = counts.duplicates;
      this.logger.debug('Import progress updated', {
        current,
        total,
        message: message.substring(0, 100),
        counts,
        populationName,
        populationId
      });
    } catch (error) {
      this.logger.error('Error updating import progress', {
        error: error.message,
        current,
        total,
        message
      });
    }
  }

  /**
   * Start import operation with enhanced progress manager
   */
  startImportOperation(options = {}) {
    try {
      this.logger.info('Starting import operation', {
        options
      });
      _progressManager.default.startOperation('import', options);
    } catch (error) {
      this.logger.error('Error starting import operation', {
        error: error.message,
        options
      });
    }
  }

  /**
   * Update import operation with session ID (called after backend response)
   */
  updateImportOperationWithSessionId(sessionId) {
    try {
      if (!sessionId) {
        this.logger.warn('No session ID provided for import operation update');
        return;
      }
      this.logger.info('Updating import operation with session ID', {
        sessionId
      });

      // Update progress manager with session ID
      if (_progressManager.default && typeof _progressManager.default.updateSessionId === 'function') {
        _progressManager.default.updateSessionId(sessionId);
      } else {
        this.logger.warn('Progress manager not available for session ID update');
      }
    } catch (error) {
      this.logger.error('Error updating import operation with session ID', {
        error: error.message,
        sessionId
      });
    }
  }

  /**
   * Start export operation with progress manager
   * 
   * @param {Object} options - Export options
   */
  startExportOperation(options = {}) {
    try {
      _progressManager.default.startOperation('export', options);
      this.logger.info('Export operation started', {
        options
      });
    } catch (error) {
      this.logger.error('Error starting export operation', {
        error: error.message,
        options
      });
    }
  }

  /**
   * Start delete operation with progress manager
   * 
   * @param {Object} options - Delete options
   */
  startDeleteOperation(options = {}) {
    try {
      _progressManager.default.startOperation('delete', options);
      this.logger.info('Delete operation started', {
        options
      });
    } catch (error) {
      this.logger.error('Error starting delete operation', {
        error: error.message,
        options
      });
    }
  }

  /**
   * Start modify operation with progress manager
   * 
   * @param {Object} options - Modify options
   */
  startModifyOperation(options = {}) {
    try {
      _progressManager.default.startOperation('modify', options);
      this.logger.info('Modify operation started', {
        options
      });
    } catch (error) {
      this.logger.error('Error starting modify operation', {
        error: error.message,
        options
      });
    }
  }

  /**
   * Complete current operation
   * 
   * @param {Object} results - Operation results
   */
  completeOperation(results = {}) {
    try {
      _progressManager.default.completeOperation(results);
      this.logger.info('Operation completed', {
        results
      });
    } catch (error) {
      this.logger.error('Error completing operation', {
        error: error.message,
        results
      });
    }
  }

  /**
   * Handle duplicate users during import
   * 
   * @param {Array} duplicates - Array of duplicate users
   * @param {Function} onDecision - Callback for user decision
   */
  handleDuplicateUsers(duplicates, onDecision) {
    try {
      _progressManager.default.handleDuplicates(duplicates, onDecision);
      this.logger.info('Duplicate users handled', {
        count: duplicates.length
      });
    } catch (error) {
      this.logger.error('Error handling duplicate users', {
        error: error.message,
        duplicates
      });
    }
  }

  /**
   * Debug log method for compatibility
   */
  debugLog(area, message) {
    if (DEBUG_MODE) {
      console.debug(`[${area}] ${message}`);
    }
  }

  /**
   * Show a status message (compatibility shim)
   * @param {string} type - Message type (success, error, warning, info)
   * @param {string} message - Main message
   * @param {string} [details] - Optional details (shown in log only)
   */
  showStatusMessage(type, message, details = '') {
    this.showStatusBar(message, type, {
      autoDismiss: type === 'success' || type === 'info'
    });
    if (details) {
      this.logger.info('Status message details', {
        type,
        message,
        details
      });
    }
  }

  /**
   * Show export status
   */
  showExportStatus() {
    try {
      this.showStatusBar('Export operation started', 'info');
      this.logger.info('Export status shown');
    } catch (error) {
      this.logger.error('Error showing export status', {
        error: error.message
      });
    }
  }

  /**
   * Update export progress
   */
  updateExportProgress(current, total, message, counts = {}) {
    try {
      _progressManager.default.updateProgress(current, total, message, {
        ...counts,
        operation: 'export'
      });
      this.logger.debug('Export progress updated', {
        current,
        total,
        message
      });
    } catch (error) {
      this.logger.error('Error updating export progress', {
        error: error.message
      });
    }
  }

  /**
   * Show delete status
   */
  showDeleteStatus(totalUsers, populationName, populationId) {
    try {
      this.showStatusBar(`Delete operation started for ${totalUsers} users in ${populationName}`, 'warning');
      this.logger.info('Delete status shown', {
        totalUsers,
        populationName,
        populationId
      });
    } catch (error) {
      this.logger.error('Error showing delete status', {
        error: error.message
      });
    }
  }

  /**
   * Update delete progress
   */
  updateDeleteProgress(current, total, message, counts = {}, populationName = '', populationId = '') {
    try {
      _progressManager.default.updateProgress(current, total, message, {
        ...counts,
        population: populationName,
        populationId: populationId,
        operation: 'delete'
      });
      this.logger.debug('Delete progress updated', {
        current,
        total,
        message,
        populationName
      });
    } catch (error) {
      this.logger.error('Error updating delete progress', {
        error: error.message
      });
    }
  }

  /**
   * Show modify status
   */
  showModifyStatus(totalUsers) {
    try {
      this.showStatusBar(`Modify operation started for ${totalUsers} users`, 'info');
      this.logger.info('Modify status shown', {
        totalUsers
      });
    } catch (error) {
      this.logger.error('Error showing modify status', {
        error: error.message
      });
    }
  }

  /**
   * Update modify progress
   */
  updateModifyProgress(current, total, message, counts = {}) {
    try {
      _progressManager.default.updateProgress(current, total, message, {
        ...counts,
        operation: 'modify'
      });
      this.logger.debug('Modify progress updated', {
        current,
        total,
        message
      });
    } catch (error) {
      this.logger.error('Error updating modify progress', {
        error: error.message
      });
    }
  }
}

// Create and export default instance
exports.UIManager = UIManager;
const uiManager = exports.uiManager = new UIManager();

// Export the class and instance

}).call(this)}).call(this,require('_process'))
},{"./circular-progress.js":41,"./element-registry.js":44,"./progress-manager.js":53,"./winston-logger.js":60,"@babel/runtime/helpers/interopRequireDefault":1,"_process":25}],59:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.VersionManager = void 0;
class VersionManager {
  constructor() {
    this.version = '5.3'; // Update this with each new version
    console.log(`Version Manager initialized with version ${this.version}`);
  }
  getVersion() {
    return this.version;
  }
  getFormattedVersion() {
    return `v${this.version}`;
  }
  updateTitle() {
    // Update the main title
    const title = document.querySelector('h1');
    if (title) {
      // Remove any existing version number
      const baseTitle = title.textContent.replace(/\s*\(v\d+\.\d+\.\d+\)\s*$/, '').trim();
      title.textContent = `${baseTitle} (${this.getFormattedVersion()})`;
    }

    // Update the document title
    document.title = `PingOne User Import ${this.getFormattedVersion()}`;

    // Update the import button text
    this.updateImportButton();

    // Update the top version badge
    this.updateTopVersionBadge();

    // Add version badge to the sidebar above the Ping Identity logo
    this.addSidebarVersionBadge();
  }
  updateImportButton() {
    const importButton = document.getElementById('start-import-btn');
    if (importButton) {
      const baseText = importButton.textContent.replace(/\s*\(v\d+\.\d+\.\d+\)\s*$/, '').trim();
      importButton.innerHTML = `<i class="pi pi-upload"></i> ${baseText} (${this.getFormattedVersion()})`;
    }
  }
  updateTopVersionBadge() {
    const versionText = document.getElementById('version-text');
    if (versionText) {
      versionText.textContent = this.getFormattedVersion();
    }
  }
  addSidebarVersionBadge() {
    // Remove existing badges if they exist
    const existingTopLeftBadge = document.getElementById('top-left-version-badge');
    if (existingTopLeftBadge) {
      existingTopLeftBadge.remove();
    }
    const existingSidebarBadge = document.getElementById('sidebar-version-badge');
    if (existingSidebarBadge) {
      existingSidebarBadge.remove();
    }

    // Check if sidebar version badge already exists
    if (document.getElementById('sidebar-version-badge')) {
      return;
    }

    // Create sidebar version badge
    const badge = document.createElement('div');
    badge.id = 'sidebar-version-badge';
    badge.className = 'sidebar-version-badge';
    badge.textContent = this.getFormattedVersion();

    // Find the footer and insert the badge just above the Ping Identity logo
    const footer = document.querySelector('.ping-footer');
    if (footer) {
      const footerContainer = footer.querySelector('.footer-container');
      if (footerContainer) {
        // Insert the badge at the beginning of the footer container
        footerContainer.insertBefore(badge, footerContainer.firstChild);
      } else {
        // Fallback: insert at the beginning of the footer
        footer.insertBefore(badge, footer.firstChild);
      }
    } else {
      // Fallback: add to body if footer not found
      document.body.appendChild(badge);
    }
  }
}

// ES Module export
exports.VersionManager = VersionManager;

},{}],60:[function(require,module,exports){
(function (process){(function (){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.apiLogger = exports.WinstonLogger = void 0;
exports.createComponentLogger = createComponentLogger;
exports.createWinstonLogger = createWinstonLogger;
exports.uiLogger = exports.tokenLogger = exports.settingsLogger = exports.fileLogger = exports.defaultLogger = void 0;
/**
 * @fileoverview Winston-compatible logger for frontend/browser environment
 * 
 * This module provides a Winston-like logging interface for the frontend
 * that maintains consistency with server-side Winston logging while
 * working within browser constraints.
 * 
 * Features:
 * - Winston-compatible API (info, warn, error, debug)
 * - Structured logging with metadata
 * - Timestamp formatting
 * - Log level filtering
 * - Console and server transport support
 * - Error stack trace handling
 * - Environment-aware configuration
 */

/**
 * Winston-compatible logger for browser environment
 */
class WinstonLogger {
  constructor(options = {}) {
    this.level = options.level || this.getDefaultLevel();
    this.service = options.service || 'pingone-import-frontend';
    this.environment = options.environment || process.env.NODE_ENV || 'development';
    this.enableServerLogging = options.enableServerLogging !== false;
    this.enableConsoleLogging = options.enableConsoleLogging !== false;

    // Log level hierarchy
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };

    // Initialize transports
    this.transports = [];
    this.initializeTransports();
  }

  /**
   * Get default log level based on environment
   */
  getDefaultLevel() {
    if (this.environment === 'production') {
      return 'info';
    } else if (this.environment === 'test') {
      return 'warn';
    } else {
      return 'debug';
    }
  }

  /**
   * Initialize logging transports
   */
  initializeTransports() {
    // Console transport
    if (this.enableConsoleLogging) {
      this.transports.push({
        name: 'console',
        log: (level, message, meta) => this.logToConsole(level, message, meta)
      });
    }

    // Server transport (if enabled)
    if (this.enableServerLogging) {
      this.transports.push({
        name: 'server',
        log: (level, message, meta) => this.logToServer(level, message, meta)
      });
    }
  }

  /**
   * Check if a log level should be logged
   */
  shouldLog(level) {
    return this.levels[level] <= this.levels[this.level];
  }

  /**
   * Format timestamp
   */
  formatTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Format log entry
   */
  formatLogEntry(level, message, meta = {}) {
    const timestamp = this.formatTimestamp();
    return {
      timestamp,
      level,
      message,
      service: this.service,
      environment: this.environment,
      ...meta
    };
  }

  /**
   * Log to console with Winston-like formatting
   */
  logToConsole(level, message, meta = {}) {
    if (!this.shouldLog(level)) return;
    const logEntry = this.formatLogEntry(level, message, meta);
    const timestamp = logEntry.timestamp;
    const levelUpper = level.toUpperCase();

    // Create formatted console message
    let consoleMessage = `[${timestamp}] [${this.service}] ${levelUpper}: ${message}`;

    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      consoleMessage += `\n${JSON.stringify(meta, null, 2)}`;
    }

    // Use appropriate console method
    switch (level) {
      case 'error':
        console.error(consoleMessage);
        break;
      case 'warn':
        console.warn(consoleMessage);
        break;
      case 'info':
        console.info(consoleMessage);
        break;
      case 'debug':
        console.debug(consoleMessage);
        break;
      default:
        console.log(consoleMessage);
    }
  }

  /**
   * Log to server via API endpoint
   */
  async logToServer(level, message, meta = {}) {
    if (!this.shouldLog(level)) return;
    try {
      const logEntry = this.formatLogEntry(level, message, meta);

      // Send to server logging endpoint
      await fetch('/api/logs/ui', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(logEntry)
      });
    } catch (error) {
      // Fallback to console if server logging fails
      console.warn('Server logging failed, falling back to console:', error.message);
      this.logToConsole(level, message, meta);
    }
  }

  /**
   * Main logging method
   */
  log(level, message, meta = {}) {
    if (!this.shouldLog(level)) return;

    // Send to all transports
    this.transports.forEach(transport => {
      try {
        transport.log(level, message, meta);
      } catch (error) {
        console.error(`Error in ${transport.name} transport:`, error);
      }
    });
  }

  /**
   * Log info level message
   */
  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  /**
   * Log warn level message
   */
  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  /**
   * Log error level message
   */
  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  /**
   * Log debug level message
   */
  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }

  /**
   * Log error with stack trace
   */
  errorWithStack(message, error, meta = {}) {
    const errorMeta = {
      ...meta,
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code,
        name: error.name
      }
    };
    this.error(message, errorMeta);
  }

  /**
   * Create child logger with additional metadata
   */
  child(additionalMeta = {}) {
    const childLogger = new WinstonLogger({
      level: this.level,
      service: this.service,
      environment: this.environment,
      enableServerLogging: this.enableServerLogging,
      enableConsoleLogging: this.enableConsoleLogging
    });

    // Override formatLogEntry to include additional metadata
    childLogger.formatLogEntry = (level, message, meta = {}) => {
      const baseEntry = this.formatLogEntry(level, message, meta);
      return {
        ...baseEntry,
        ...additionalMeta
      };
    };
    return childLogger;
  }

  /**
   * Set log level
   */
  setLevel(level) {
    if (this.levels.hasOwnProperty(level)) {
      this.level = level;
    } else {
      this.warn(`Invalid log level: ${level}`);
    }
  }

  /**
   * Enable/disable server logging
   */
  setServerLogging(enabled) {
    this.enableServerLogging = enabled;

    // Update transports
    this.transports = this.transports.filter(t => t.name !== 'server');
    if (enabled) {
      this.transports.push({
        name: 'server',
        log: (level, message, meta) => this.logToServer(level, message, meta)
      });
    }
  }

  /**
   * Enable/disable console logging
   */
  setConsoleLogging(enabled) {
    this.enableConsoleLogging = enabled;

    // Update transports
    this.transports = this.transports.filter(t => t.name !== 'console');
    if (enabled) {
      this.transports.push({
        name: 'console',
        log: (level, message, meta) => this.logToConsole(level, message, meta)
      });
    }
  }
}

/**
 * Create default logger instance
 */
exports.WinstonLogger = WinstonLogger;
function createWinstonLogger(options = {}) {
  return new WinstonLogger(options);
}

/**
 * Create component-specific logger
 */
function createComponentLogger(component, options = {}) {
  return createWinstonLogger({
    ...options,
    service: `${options.service || 'pingone-import'}-${component}`
  });
}

/**
 * Default logger instances
 */
const defaultLogger = exports.defaultLogger = createWinstonLogger();
const apiLogger = exports.apiLogger = createComponentLogger('api');
const uiLogger = exports.uiLogger = createComponentLogger('ui');
const fileLogger = exports.fileLogger = createComponentLogger('file');
const settingsLogger = exports.settingsLogger = createComponentLogger('settings');
const tokenLogger = exports.tokenLogger = createComponentLogger('token');

// Export the class for custom instances

}).call(this)}).call(this,require('_process'))
},{"_process":25}]},{},[39]);
