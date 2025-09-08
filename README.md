# innertube_proxy_extension
This is an extension that redirects YouTube's Innertube API requests to [innertube_proxy_server](https://github.com/OutRite/innertube_proxy_server).

## Notes
This extension has been tested on both Firefox and Chrome, and seems to work fine on both.

This extension hooks fetch() using an injected script, which communicates innertube requests to the background script
via a middleman content script that communicates using DOM events and extension events. As such, I imagine this is a
generally unstable way of doing things and issues are likely to arise as a result. Also, because of this mechanism,
innertube requests will not appear in the Network tab of basic browser devtools.

Currently it is not possible to configure the endpoint used for innertube_proxy_server, so you must have it running on
localhost at port 53417. Please see innertube_proxy_server for setup instructions.
