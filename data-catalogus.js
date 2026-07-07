const numberFormat = new Intl.NumberFormat("nl-NL");
const state = {
	producten: [],
	gegevensbronnen: [],
	gegevenssets: [],
	relaties: [],
	zoek: "",
	laag: "",
};

const elements = {
	producten: document.querySelector("#catalogusProducten"),
	bronnen: document.querySelector("#catalogusBronnen"),
	sets: document.querySelector("#catalogusSets"),
	herkomstlijnen: document.querySelector("#catalogusHerkomstlijnen"),
	zoek: document.querySelector("#catalogusZoek"),
	laag: document.querySelector("#catalogusLaag"),
	productRijen: document.querySelector("#catalogusProductRijen"),
	bronRijen: document.querySelector("#catalogusBronRijen"),
	setRijen: document.querySelector("#catalogusSetRijen"),
};

async function fetchJson(path) {
	const response = await fetch(path);
	if (!response.ok) throw new Error(`${path} kon niet geladen worden: ${response.status}`);
	return response.json();
}

function text(value) {
	if (Array.isArray(value)) return value.filter(Boolean).join(", ");
	if (value && typeof value === "object") return Object.values(value).filter(Boolean).join(", ");
	return String(value ?? "");
}

function matches(item) {
	if (!state.zoek) return true;
	return JSON.stringify(item).toLowerCase().includes(state.zoek);
}

function cell(value) {
	const td = document.createElement("td");
	td.textContent = text(value) || "-";
	return td;
}

function linkCell(value) {
	const td = document.createElement("td");
	const values = Array.isArray(value) ? value : [value].filter(Boolean);
	if (!values.length) {
		td.textContent = "-";
		return td;
	}
	for (const entry of values) {
		const label = text(entry);
		if (!label) continue;
		const anchor = document.createElement("a");
		anchor.href = label;
		anchor.textContent = label;
		td.append(anchor);
		td.append(document.createElement("br"));
	}
	return td;
}

function renderSummary() {
	elements.producten.textContent = numberFormat.format(state.producten.length);
	elements.bronnen.textContent = numberFormat.format(state.gegevensbronnen.length);
	elements.sets.textContent = numberFormat.format(state.gegevenssets.length);
	elements.herkomstlijnen.textContent = numberFormat.format(state.relaties.length);
}

function renderLayers() {
	const lagen = [...new Set(state.gegevenssets.map((set) => set.laag).filter(Boolean))].sort();
	elements.laag.append(
		...lagen.map((laag) => {
			const option = document.createElement("option");
			option.value = laag;
			option.textContent = laag;
			return option;
		})
	);
}

function renderProducts() {
	const rows = state.producten.filter(matches).map((product) => {
		const tr = document.createElement("tr");
		tr.append(cell(product.titel || product.slug));
		tr.append(cell(product.status));
		tr.append(cell(product.bronnen || []));
		tr.append(linkCell(Object.values(product.publiekeEindpunten || {})));
		return tr;
	});
	elements.productRijen.replaceChildren(...rows);
}

function renderSources() {
	const rows = state.gegevensbronnen.filter(matches).map((bron) => {
		const tr = document.createElement("tr");
		const title = document.createElement("td");
		if (bron.url) {
			const anchor = document.createElement("a");
			anchor.href = bron.url;
			anchor.textContent = bron.titel || bron.id;
			title.append(anchor);
		} else {
			title.textContent = bron.titel || bron.id;
		}
		tr.append(title);
		tr.append(cell(bron.aanbieder));
		tr.append(cell(bron.type));
		tr.append(cell(bron.producten || []));
		return tr;
	});
	elements.bronRijen.replaceChildren(...rows);
}

function renderDatasets() {
	const rows = state.gegevenssets
		.filter((set) => !state.laag || set.laag === state.laag)
		.filter(matches)
		.map((set) => {
			const tr = document.createElement("tr");
			tr.append(cell(set.titel || set.id));
			tr.append(cell(set.product));
			tr.append(cell(set.laag));
			tr.append(linkCell((set.bestanden || []).map((bestand) => bestand.pad)));
			return tr;
		});
	elements.setRijen.replaceChildren(...rows);
}

function renderAll() {
	renderSummary();
	renderProducts();
	renderSources();
	renderDatasets();
}

async function init() {
	const [producten, bronnen, sets, afstamming] = await Promise.all([fetchJson("/api/v1/catalogus/producten.json"), fetchJson("/api/v1/catalogus/gegevensbronnen.json"), fetchJson("/api/v1/catalogus/gegevenssets.json"), fetchJson("/api/v1/catalogus/afstamming.json")]);
	state.producten = producten.producten || [];
	state.gegevensbronnen = bronnen.gegevensbronnen || [];
	state.gegevenssets = sets.gegevenssets || [];
	state.relaties = afstamming.relaties || [];
	renderLayers();
	renderAll();
	elements.zoek.addEventListener("input", () => {
		state.zoek = elements.zoek.value.trim().toLowerCase();
		renderAll();
	});
	elements.laag.addEventListener("change", () => {
		state.laag = elements.laag.value;
		renderDatasets();
	});
}

init().catch((error) => {
	console.error(error);
	const message = document.createElement("p");
	message.textContent = error.message;
	document.querySelector(".data-catalogus").append(message);
});
