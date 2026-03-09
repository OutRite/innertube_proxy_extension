var ipe_uhfetch = window.fetch;
// XHR is still used by YouTube Studio =(
var ipe_uhxhr = XMLHttpRequest.prototype.send;
var ipe_uhxhropen = XMLHttpRequest.prototype.open;
var ipe_uhxhrsrh = XMLHttpRequest.prototype.setRequestHeader;
var ipe_uhxhrgrh = XMLHttpRequest.prototype.getResponseHeader;

async function communicate_with_content_script(message) {
	// Sends message to the content script, and returns the response.
	// Communication uses DOM events, via window
	const message_id = crypto.randomUUID();
	return new Promise((resolve) => {
		const csrecv = (cs_response) => {
			resolve(cs_response);
			window.removeEventListener(`itpe_in ${message_id}`, csrecv);
		};
		window.addEventListener(`itpe_in ${message_id}`, csrecv);
		const structured_message = {
			message_id: message_id,
			message: message
		};
		const cs_message = new CustomEvent("itpe_out", {
			detail: structured_message
		});
		window.dispatchEvent(cs_message);
	});
}

async function ipe_neofetch(resource, options) {
	let original_url = "";
	if (resource.url) {
		// YouTube does some weird thing to certain data: URLs to make them appear as innertube URLs, afaict it's an adblock detection mechanism given the fake responses.
		// We can prevent this from interfering with the proxy by simply calling .clone() on the resource, which forces .url to reveal the true URL instead of the fake one.
		const rsclone = resource.clone();
		original_url = rsclone.url;
	} else {
		original_url = resource.toString();
	}
	const original_url_object = new URL(original_url);
	const original_hostname = original_url_object.hostname;
	const original_pathname = original_url_object.pathname;
	if ((original_hostname == "youtube.com" || original_hostname.endsWith(".youtube.com")) && original_pathname.startsWith("/youtubei/")) {
		const original_headers = [...resource.headers.entries()];
		const rsclone = resource.clone();
		const original_buffer = await rsclone.arrayBuffer();
		const original_body = Array.from(new Uint8Array(original_buffer));
		const original_method = resource.method;
		const cs_reqdata = {
			url: original_url,
			headers: original_headers,
			body: original_body,
			method: original_method
		};
		const serialized_response_data = await communicate_with_content_script(cs_reqdata);
		const response_data = JSON.parse(serialized_response_data.detail);
		const response_body = response_data.body;
		const response_status_code = response_data.status_code;
		const response_headers = response_data.headers;
		const response_headers_assembled = new Headers(response_headers);
		const final_response = new Response(response_body, {
			status: response_status_code,
			statusText: "",
			headers: response_headers_assembled
		});
		//const real_response = await ipe_uhfetch(resource, options);
		//console.log(real_response);
		//return real_response;
		return final_response;
	} else {
		// This is not an innertube request, so no modification is necessary.
		return ipe_uhfetch(resource, options);
	}
}

function ipe_neoxhr(original_body) {
	const original_url = this.url;
	const original_url_object = new URL(original_url, window.location.href);
	const original_url_resolved = original_url_object.href;
	const original_hostname = original_url_object.hostname;
	const original_pathname = original_url_object.pathname;
	if ((original_hostname == "youtube.com" || original_hostname.endsWith(".youtube.com")) && original_pathname.startsWith("/youtubei/")) {
		const original_headers = this.headers;
		const original_method = this.method;
		const cs_reqdata = {
			url: original_url_resolved,
			headers: original_headers,
			body: original_body,
			method: original_method
		};
		const xhr_this = this;
		communicate_with_content_script(cs_reqdata).then((serialized_response_data) => {
			const response_data = JSON.parse(serialized_response_data.detail);
			const response_body = response_data.body;
			const response_status_code = response_data.status_code;
			const response_headers = response_data.headers;
			Object.defineProperty(xhr_this, "status", {
				value: response_status_code,
				writable: false
			});
			Object.defineProperty(xhr_this, "responseText", {
				value: response_body,
				writable: false
			});
			Object.defineProperty(xhr_this, "response", {
				value: response_body,
				writable: false
			});
			Object.defineProperty(xhr_this, "readyState", {
				value: 4,
				writable: false
			});
			xhr_this.response_headers = response_headers;
			xhr_this.dispatchEvent(new Event("load"));
			xhr_this.dispatchEvent(new Event("loadend"));
			xhr_this.dispatchEvent(new Event("readystatechange"));
		});
		return;
	} else {
		return ipe_uhxhr.apply(this, arguments);
	}
};

function ipe_neoxhropen(method, url, async) {
	if (this.aopen) {
		return false;
	}
	this.method = method;
	this.url = url.toString();
	if (async === undefined) {
		this.async = true;
	} else {
		this.async = async;
	}
	this.headers = [];
	this.aopen = true;
	return ipe_uhxhropen.apply(this, arguments);
}

function ipe_neoxhrsrh(header, value) {
	if (this.arecs) {return;}
	this.headers.push([header, value]);
	this.arecs = true;
	const retval = ipe_uhxhrsrh.apply(this, arguments);
	this.arecs=undefined;
	return retval;
}

function ipe_neoxhrgrh(header) {
	if (!this.response_headers) {
		return ipe_uhxhrgrh.apply(this, arguments);
	}
	const lower_header = header.toLowerCase();
	for (const [nheader, nvalue] of this.response_headers) {
		if (lower_header == nheader.toLowerCase()) {
			return nvalue;
		}
	}
	return null;
}

if (!window.ipe_initialized) {
	window.fetch = ipe_neofetch;
	XMLHttpRequest.prototype.send = ipe_neoxhr;
	XMLHttpRequest.prototype.open = ipe_neoxhropen;
	XMLHttpRequest.prototype.setRequestHeader = ipe_neoxhrsrh;
	XMLHttpRequest.prototype.getResponseHeader = ipe_neoxhrgrh;
}

XMLHttpRequest.prototype.getAllResponseHeaders = function() {
	console.log("TODO: xhr.gARH");
}

window.ipe_initialized = true;
// TODO: Implement XMLHttpRequest.getResponseHeader and .getAllResponseHeaders
//       (Does YouTube use these?)
