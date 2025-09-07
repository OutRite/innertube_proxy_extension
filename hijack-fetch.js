var ipe_uhfetch = window.fetch;

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

async function neofetch(resource, options) {
	// FIXME: This does not account for the possibility that resource is a Request object. Does YT ever do this?
	console.log(`neofetch called`);
	//console.log(resource);
	console.log(options);
	console.log("getting basic data");
	let original_url = "";
	if (resource.url) {
		// YouTube does some weird thing to certain data: URLs to make them appear as innertube URLs, afaict it's an adblock detection mechanism given the fake responses.
		// We can prevent this from interfering with the proxy by simply calling .clone() on the resource, which forces .url to reveal the true URL instead of the fake one.
		const rsclone = resource.clone();
		original_url = rsclone.url;
	} else {
		original_url = resource.toString();
	}
	console.log('setting original');
	const original_url_object = new URL(original_url);
	console.log('setting hostname');
	const original_hostname = original_url_object.hostname;
	console.log('setting pathname');
	const original_pathname = original_url_object.pathname;
	console.log('checking req type');
	if ((original_hostname == "youtube.com" || original_hostname.endsWith(".youtube.com")) && original_pathname.startsWith("/youtubei/")) {
		console.log("innertube request detected");
		const original_headers = [...resource.headers.entries()];
		const rsclone = resource.clone();
		const original_body = rsclone.text();
		const original_method = resource.method;
		const cs_reqdata = {
			url: original_url,
			headers: original_headers,
			body: original_body,
			method: original_method
		};
		const response_data = await communicate_with_content_script(cs_reqdata);
		console.log(`Received from content script: ${response_data.detail}`);
		const real_response = await ipe_uhfetch(resource, options);
		console.log(real_response);
		return real_response;
		//return ipe_uhfetch(resource, options);
	} else {
		// This is not an innertube request, so no modification is necessary.
		return ipe_uhfetch(resource, options);
	}
}

window.fetch = neofetch;

