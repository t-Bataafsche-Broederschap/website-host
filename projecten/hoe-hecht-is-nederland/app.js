/* global d3 */

const tooltip = document.querySelector("#tooltip");
const tabButtons = document.querySelectorAll("[data-tab]");
const tabPanels = document.querySelectorAll(".project-tab-panel");
const snapshotCards = document.querySelector("#snapshotCards");
const trendMetricPicker = document.querySelector("#trendMetricPicker");
const trendStory = document.querySelector("#trendStory");
const trustContrast = document.querySelector("#trustContrast");
const trustTrendPicker = document.querySelector("#trustTrendPicker");
const yearPicker = document.querySelector("#neighborhoodYearPicker");
const provinceTitle = document.querySelector("#province-title");
const provinceScore = document.querySelector("#provinceScore");
const provinceItems = document.querySelector("#provinceItems");
const profileGroupSelect = document.querySelector("#profileGroupSelect");
const profileMetricSelect = document.querySelector("#profileMetricSelect");
const profileInsight = document.querySelector("#profileInsight");
const historyLegend = document.querySelector("#historyLegend");
const belongingStatements = document.querySelector("#belongingStatements");
const belongingSummary = document.querySelector("#belongingSummary");
const belongingProfileGroupSelect = document.querySelector("#belongingProfileGroupSelect");
const exclusionGroupSelect = document.querySelector("#exclusionGroupSelect");
const exclusionProfiles = document.querySelector("#exclusionProfiles");
const bridgingContact = document.querySelector("#bridgingContact");
const nationalConnectionMetricSelect = document.querySelector("#nationalConnectionMetricSelect");
const nationalConnectionGroupSelect = document.querySelector("#nationalConnectionGroupSelect");
const nationalConnectionProfiles = document.querySelector("#nationalConnectionProfiles");
const identityProfiles = document.querySelector("#identityProfiles");
const integrationMetricSelect = document.querySelector("#integrationMetricSelect");

const trendSvg = d3.select("#trendChart");
const trustSvg = d3.select("#trustChart");
const trustTrendSvg = d3.select("#trustTrendChart");
const mapSvg = d3.select("#provinceMap");
const profileSvg = d3.select("#profileChart");
const historyParticipationSvg = d3.select("#historyParticipationChart");
const historyNeighborhoodSvg = d3.select("#historyNeighborhoodChart");
const belongingProfileSvg = d3.select("#belongingProfileChart");
const homeFeelingTrendSvg = d3.select("#homeFeelingTrendChart");
const integrationHistorySvg = d3.select("#integrationHistoryChart");

const percent = new Intl.NumberFormat("nl-NL", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const signed = new Intl.NumberFormat("nl-NL", { minimumFractionDigits: 1, maximumFractionDigits: 1, signDisplay: "always" });

const colors = {
	socialContact: "#3f8f86",
	informalHelp: "#d4a44c",
	volunteering: "#c95d4c",
	peopleTrust: "#6d78c8",
	politicians: "#c95d4c",
	secondChamber: "#d8894c",
	police: "#3f8f86",
	judges: "#3978a8",
	loneliness: "#b34d73",
	socialLoneliness: "#985caa",
	emotionalLoneliness: "#d26983",
	familyContact: "#3f8f86",
	friendContact: "#6d78c8",
	neighborContact: "#d4a44c",
};

const trustTrendColors = {
	VertrouwenInAndereMensen_1: "#6d78c8",
	Kerken_2: "#985caa",
	Rechters_3: "#3978a8",
	Politie_4: "#3f8f86",
	Leger_5: "#7f9560",
	Gezondheidszorg_6: "#4b9a83",
	Pers_7: "#d8894c",
	Ambtenaren_8: "#8b7cc1",
	Politici_9: "#c95d4c",
	Gemeenteraad_10: "#d4a44c",
	TweedeKamer_11: "#b34d73",
	EuropeseUnie_12: "#4f70b5",
	Banken_13: "#9a7354",
	GroteBedrijven_14: "#66747a",
};

const historicalMetrics = [
	["familyContact", "Wekelijks contact met familie"],
	["friendContact", "Wekelijks contact met vrienden"],
	["neighborContact", "Wekelijks contact met buren"],
	["volunteering", "Vrijwilligerswerk"],
	["informalHelp", "Informele hulp"],
];

const provinceTiles = {
	"Noord-Holland": [0, 2],
	"Zuid-Holland": [0, 3],
	Zeeland: [0, 4],
	Flevoland: [1, 2],
	Utrecht: [1, 3],
	"Noord-Brabant": [1, 4],
	Fryslân: [2, 0],
	Drenthe: [2, 1],
	Gelderland: [2, 2],
	Limburg: [2, 4],
	Groningen: [3, 0],
	Overijssel: [3, 2],
};

const state = {
	tab: "trend",
	trendMetrics: new Set(["socialContact", "volunteering", "peopleTrust"]),
	trustTrendKeys: new Set(["Politie_4", "Rechters_3", "Politici_9"]),
	neighborhoodYear: 2025,
	province: "NL01",
	profileGroup: "Leeftijd",
	profileMetric: "volunteering",
	belongingProfileGroup: "Opleiding",
	exclusionGroup: "Herkomst",
	nationalConnectionMetric: "home",
	nationalConnectionGroup: "Leeftijd",
	integrationMetric: "feelsAtHome",
};

let data;

function formatPercent(value) {
	return Number.isFinite(value) ? `${percent.format(value)}%` : "–";
}

function formatScore(value) {
	return Number.isFinite(value) ? percent.format(value) : "–";
}

function intervalText(item) {
	if (!Number.isFinite(item?.lower) || !Number.isFinite(item?.upper)) return "";
	return `95%-interval: ${percent.format(item.lower)}–${percent.format(item.upper)}`;
}

function metricInfo(key) {
	return data.metricInfo[key] || { label: key, shortLabel: key, direction: "higher" };
}

function chartSize(svg, preferredHeight) {
	const node = svg.node();
	const width = Math.max(320, Math.floor(node.parentElement.getBoundingClientRect().width));
	const height = window.matchMedia("(max-width: 720px)").matches ? Math.min(preferredHeight, 440) : preferredHeight;
	svg.attr("viewBox", `0 0 ${width} ${height}`).attr("width", width).attr("height", height);
	return { width, height };
}

function moveTooltip(event) {
	if (window.positionProjectTooltip) window.positionProjectTooltip(event, tooltip);
}

function showTooltip(event, title, rows) {
	tooltip.hidden = false;
	tooltip.setAttribute("aria-hidden", "false");
	tooltip.innerHTML = `<strong>${title}</strong>${rows.map((row) => `<span>${row}</span>`).join("")}`;
	moveTooltip(event);
}

function hideTooltip() {
	tooltip.hidden = true;
	tooltip.setAttribute("aria-hidden", "true");
}

function latestTrend() {
	return data.nationalTrend.at(-1);
}

function previousTrend() {
	return data.nationalTrend.at(-2);
}

function deltaFor(metric) {
	const latest = latestTrend()[metric]?.value;
	const previous = previousTrend()[metric]?.value;
	return Number.isFinite(latest) && Number.isFinite(previous) ? latest - previous : null;
}

function renderSnapshot() {
	const latest = latestTrend();
	const national = data.neighborhood.find((region) => region.key === "NL01").years.find((item) => item.year === 2025);
	const items = [
		{ label: "Wekelijks sociaal contact", value: latest.socialContact.value, delta: deltaFor("socialContact"), unit: "%" },
		{ label: "Vrijwilligerswerk", value: latest.volunteering.value, delta: deltaFor("volunteering"), unit: "%" },
		{ label: "Vertrouwen in mensen", value: latest.peopleTrust.value, delta: deltaFor("peopleTrust"), unit: "%" },
		{ label: "Vertrouwen in politici", value: latest.politicians.value, delta: deltaFor("politicians"), unit: "%" },
		{ label: "Buurtcohesie", value: national.score.value, unit: "/10", note: "stabiel sinds 2023" },
	];
	snapshotCards.replaceChildren(
		...items.map((item) => {
			const card = document.createElement("article");
			const value = item.unit === "/10" ? formatScore(item.value) : percent.format(item.value);
			const delta = Number.isFinite(item.delta) ? `${signed.format(item.delta)} punt t.o.v. 2024` : item.note;
			card.className = Number.isFinite(item.delta) && item.delta < 0 ? "is-down" : "";
			card.innerHTML = `<span>${item.label}</span><strong>${value}<small>${item.unit}</small></strong><em>${delta || ""}</em>`;
			return card;
		})
	);
}

function renderTrendStory() {
	const items = ["socialContact", "volunteering", "peopleTrust", "informalHelp"].map((metric) => ({ metric, delta: deltaFor(metric) }));
	trendStory.replaceChildren(
		...items.map(({ metric, delta }) => {
			const element = document.createElement("article");
			element.innerHTML = `<span>${metricInfo(metric).label}</span><strong>${signed.format(delta)} punt</strong><small>verandering 2024–2025</small>`;
			return element;
		})
	);
}

function renderTrend() {
	const selected = [...state.trendMetrics];
	const { width, height } = chartSize(trendSvg, 500);
	const margin = { top: 26, right: 26, bottom: 48, left: 58 };
	const innerWidth = width - margin.left - margin.right;
	const innerHeight = height - margin.top - margin.bottom;
	trendSvg.selectAll("*").remove();
	const root = trendSvg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
	const years = data.nationalTrend.map((row) => row.year);
	const values = data.nationalTrend.flatMap((row) => selected.map((metric) => row[metric]?.value).filter(Number.isFinite));
	const yMin = Math.max(0, Math.floor((d3.min(values) - 8) / 10) * 10);
	const yMax = Math.min(100, Math.ceil((d3.max(values) + 5) / 10) * 10);
	const x = d3.scaleLinear().domain(d3.extent(years)).range([0, innerWidth]);
	const y = d3.scaleLinear().domain([yMin, yMax]).nice().range([innerHeight, 0]);

	root.append("g").attr("class", "grid").call(d3.axisLeft(y).ticks(6).tickSize(-innerWidth).tickFormat(""));
	root
		.append("g")
		.attr("class", "axis")
		.attr("transform", `translate(0,${innerHeight})`)
		.call(
			d3
				.axisBottom(x)
				.tickFormat(d3.format("d"))
				.ticks(Math.min(7, years.length - 1))
		);
	root
		.append("g")
		.attr("class", "axis")
		.call(
			d3
				.axisLeft(y)
				.ticks(6)
				.tickFormat((value) => `${value}%`)
		);

	const line = d3
		.line()
		.defined((point) => Number.isFinite(point.value))
		.x((point) => x(point.year))
		.y((point) => y(point.value))
		.curve(d3.curveMonotoneX);
	for (const metric of selected) {
		const points = data.nationalTrend.map((row) => ({ year: row.year, ...row[metric] }));
		root.append("path").datum(points).attr("class", "trend-line").attr("stroke", colors[metric]).attr("d", line);
		root
			.selectAll(`.point-${metric}`)
			.data(points.filter((point) => Number.isFinite(point.value)))
			.join("circle")
			.attr("class", "trend-point")
			.attr("cx", (point) => x(point.year))
			.attr("cy", (point) => y(point.value))
			.attr("r", (point) => (point.year === 2025 ? 5 : 3))
			.attr("fill", colors[metric])
			.on("pointerenter", (event, point) => showTooltip(event, `${metricInfo(metric).label} · ${point.year}`, [formatPercent(point.value), intervalText(point)]))
			.on("pointermove", moveTooltip)
			.on("pointerleave", hideTooltip);
	}
}

function renderHistoryParticipation() {
	const rows = data.history.participation;
	const { width, height } = chartSize(historyParticipationSvg, 500);
	const margin = { top: 22, right: 24, bottom: 48, left: 58 };
	const innerWidth = width - margin.left - margin.right;
	const innerHeight = height - margin.top - margin.bottom;
	historyParticipationSvg.selectAll("*").remove();
	const root = historyParticipationSvg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
	const x = d3
		.scaleLinear()
		.domain(d3.extent(rows, (row) => row.year))
		.range([0, innerWidth]);
	const y = d3.scaleLinear().domain([20, 90]).range([innerHeight, 0]);
	root.append("g").attr("class", "grid").call(d3.axisLeft(y).ticks(7).tickSize(-innerWidth).tickFormat(""));
	root
		.append("g")
		.attr("class", "axis")
		.attr("transform", `translate(0,${innerHeight})`)
		.call(
			d3
				.axisBottom(x)
				.tickFormat(d3.format("d"))
				.ticks(Math.min(8, rows.length - 1))
		);
	root
		.append("g")
		.attr("class", "axis")
		.call(
			d3
				.axisLeft(y)
				.ticks(7)
				.tickFormat((value) => `${value}%`)
		);

	const line = d3
		.line()
		.defined((point) => Number.isFinite(point.value))
		.x((point) => x(point.year))
		.y((point) => y(point.value))
		.curve(d3.curveMonotoneX);
	for (const [metric, label] of historicalMetrics) {
		const points = rows.map((row) => ({ year: row.year, value: row[metric] }));
		root.append("path").datum(points).attr("class", "trend-line history-line").attr("stroke", colors[metric]).attr("d", line);
		root
			.selectAll(`.history-point-${metric}`)
			.data(points.filter((point) => Number.isFinite(point.value)))
			.join("circle")
			.attr("class", "trend-point")
			.attr("cx", (point) => x(point.year))
			.attr("cy", (point) => y(point.value))
			.attr("r", 3)
			.attr("fill", colors[metric])
			.on("pointerenter", (event, point) => showTooltip(event, `${label} · ${point.year}`, [formatPercent(point.value), "Historische reeks, 12 jaar of ouder"]))
			.on("pointermove", moveTooltip)
			.on("pointerleave", hideTooltip);
	}

	historyLegend.replaceChildren(
		...historicalMetrics.map(([metric, label]) => {
			const item = document.createElement("span");
			item.innerHTML = `<i style="--legend-color:${colors[metric]}"></i>${label}`;
			return item;
		})
	);
}

function renderHistoryNeighborhood() {
	const rows = data.history.neighborhood;
	const { width, height } = chartSize(historyNeighborhoodSvg, 320);
	const margin = { top: 24, right: 54, bottom: 44, left: 56 };
	const innerWidth = width - margin.left - margin.right;
	const innerHeight = height - margin.top - margin.bottom;
	historyNeighborhoodSvg.selectAll("*").remove();
	const root = historyNeighborhoodSvg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
	const x = d3.scaleLinear().domain([2005, 2025]).range([0, innerWidth]);
	const y = d3.scaleLinear().domain([98, 106]).range([innerHeight, 0]);
	root.append("g").attr("class", "grid").call(d3.axisLeft(y).ticks(4).tickSize(-innerWidth).tickFormat(""));
	root
		.append("g")
		.attr("class", "axis")
		.attr("transform", `translate(0,${innerHeight})`)
		.call(
			d3
				.axisBottom(x)
				.tickFormat(d3.format("d"))
				.ticks(width < 620 ? 5 : 10)
		);
	root.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(4));
	root.append("line").attr("class", "history-baseline").attr("x1", 0).attr("x2", innerWidth).attr("y1", y(100)).attr("y2", y(100));
	const line = d3
		.line()
		.x((row) => x(row.year))
		.y((row) => y(row.index))
		.curve(d3.curveMonotoneX);
	root.append("path").datum(rows).attr("class", "trend-line neighborhood-history-line").attr("d", line);
	root
		.selectAll("circle.neighborhood-history-point")
		.data(rows)
		.join("circle")
		.attr("class", "trend-point neighborhood-history-point")
		.attr("cx", (row) => x(row.year))
		.attr("cy", (row) => y(row.index))
		.attr("r", (row) => (row.year === 2005 || row.year === 2025 ? 5 : 3))
		.on("pointerenter", (event, row) => showTooltip(event, `Buurtcohesie · ${row.year}`, [`Index: ${percent.format(row.index)}`, "2005 = 100"]))
		.on("pointermove", moveTooltip)
		.on("pointerleave", hideTooltip);
	for (const row of rows.filter((item) => item.year === 2005 || item.year === 2025)) {
		root
			.append("text")
			.attr("class", "history-value")
			.attr("x", x(row.year) + (row.year === 2005 ? 9 : -9))
			.attr("y", y(row.index) - 12)
			.attr("text-anchor", row.year === 2005 ? "start" : "end")
			.text(percent.format(row.index));
	}
}

function renderHistory() {
	renderHistoryParticipation();
	renderHistoryNeighborhood();
}

function renderBelongingStatements() {
	belongingStatements.replaceChildren(
		...data.belonging.scp.statements.map((item) => {
			const row = document.createElement("article");
			row.className = item.negative ? "is-negative" : "";
			row.innerHTML = `<div><span>${item.label}</span><strong>${percent.format(item.agree)}% eens</strong></div><div class="response-bar" aria-label="${percent.format(item.disagree)} procent oneens, ${percent.format(item.neutral)} procent neutraal, ${percent.format(item.agree)} procent eens"><i class="response-disagree" style="width:${item.disagree}%"></i><i class="response-neutral" style="width:${item.neutral}%"></i><i class="response-agree" style="width:${item.agree}%"></i><i class="response-missing" style="width:${item.missing}%"></i></div>`;
			return row;
		})
	);
}

function renderBelongingSummary() {
	const statements = Object.fromEntries(data.belonging.scp.statements.map((item) => [item.key, item]));
	const cards = [
		["Hoort erbij", statements.belongs.agree, "SCP · 18-plus"],
		["Voelt zich betrokken", statements.involved.agree, "SCP · 18-plus"],
		["Voelt zich buitengesloten", data.belonging.cbsExclusion.overall, "CBS · 15-plus"],
	];
	belongingSummary.replaceChildren(
		...cards.map(([label, value, note], index) => {
			const item = document.createElement("article");
			item.className = index === 2 ? "is-alert" : "";
			item.innerHTML = `<span>${label}</span><strong>${percent.format(value)}%</strong><small>${note} · 2024</small>`;
			return item;
		})
	);
}

function populateBelongingControls() {
	const profileGroups = [...new Set(data.belonging.scp.profiles.map((row) => row.group))].filter((group) => group !== "Totaal");
	for (const group of profileGroups) {
		const option = document.createElement("option");
		option.value = group;
		option.textContent = group;
		belongingProfileGroupSelect.append(option);
	}
	const exclusionGroups = [...new Set(data.belonging.cbsExclusion.profiles.map((row) => row.group))];
	for (const group of exclusionGroups) {
		const option = document.createElement("option");
		option.value = group;
		option.textContent = group;
		exclusionGroupSelect.append(option);
	}
	const connectionGroups = [...new Set(data.belonging.nationalConnection.profiles.map((row) => row.group))];
	for (const group of connectionGroups) {
		const option = document.createElement("option");
		option.value = group;
		option.textContent = group;
		nationalConnectionGroupSelect.append(option);
	}
	belongingProfileGroupSelect.value = state.belongingProfileGroup;
	exclusionGroupSelect.value = state.exclusionGroup;
	nationalConnectionMetricSelect.value = state.nationalConnectionMetric;
	nationalConnectionGroupSelect.value = state.nationalConnectionGroup;
	integrationMetricSelect.value = state.integrationMetric;
}

function renderBelongingProfiles() {
	const rows = data.belonging.scp.profiles.filter((row) => row.group === state.belongingProfileGroup).sort((a, b) => a.order - b.order);
	const { width, height } = chartSize(belongingProfileSvg, Math.max(280, rows.length * 70 + 76));
	const margin = { top: 18, right: 56, bottom: 42, left: width < 560 ? 142 : 192 };
	const innerWidth = width - margin.left - margin.right;
	const innerHeight = height - margin.top - margin.bottom;
	belongingProfileSvg.selectAll("*").remove();
	const root = belongingProfileSvg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
	const x = d3.scaleLinear().domain([0, 100]).range([0, innerWidth]);
	const y = d3
		.scaleBand()
		.domain(rows.map((row) => row.label))
		.range([0, innerHeight])
		.padding(0.34);
	root.append("g").attr("class", "grid").attr("transform", `translate(0,${innerHeight})`).call(d3.axisBottom(x).ticks(5).tickSize(-innerHeight).tickFormat(""));
	root.append("g").attr("class", "axis profile-axis").call(d3.axisLeft(y).tickSize(0));
	root
		.append("g")
		.attr("class", "axis")
		.attr("transform", `translate(0,${innerHeight})`)
		.call(
			d3
				.axisBottom(x)
				.ticks(5)
				.tickFormat((value) => `${value}%`)
		);
	root
		.selectAll("rect.belonging-profile-bar")
		.data(rows)
		.join("rect")
		.attr("class", "belonging-profile-bar")
		.attr("x", 0)
		.attr("y", (row) => y(row.label))
		.attr("width", (row) => x(row.value))
		.attr("height", y.bandwidth())
		.attr("rx", 5);
	root
		.selectAll("text.belonging-profile-value")
		.data(rows)
		.join("text")
		.attr("class", "history-value")
		.attr("x", (row) => x(row.value) + 8)
		.attr("y", (row) => y(row.label) + y.bandwidth() / 2)
		.attr("dominant-baseline", "middle")
		.text((row) => formatPercent(row.value));
}

function renderExclusionProfiles() {
	const rows = data.belonging.cbsExclusion.profiles.filter((row) => row.group === state.exclusionGroup).sort((a, b) => a.order - b.order);
	exclusionProfiles.replaceChildren(
		...rows.map((row) => {
			const item = document.createElement("article");
			item.innerHTML = `<div><span>${row.label}</span><strong>${formatPercent(row.value)}</strong></div><div class="exclusion-bar"><i style="width:${Math.min(100, (row.value / 35) * 100)}%"></i><b style="left:${(data.belonging.cbsExclusion.overall / 35) * 100}%" title="Nederland: ${formatPercent(data.belonging.cbsExclusion.overall)}"></b></div>`;
			return item;
		})
	);
}

function renderBridgingContact() {
	bridgingContact.replaceChildren(
		...data.belonging.cbsExclusion.bridgingContact.map((row) => {
			const item = document.createElement("article");
			const gap = row.excludedWithoutContact - row.excludedWithContact;
			item.innerHTML = `<div><span>${row.label}</span><strong>${formatPercent(row.weeklyContact)}</strong><small>heeft wekelijks contact</small></div><div class="bridging-gap"><span>Met contact <b>${formatPercent(row.excludedWithContact)}</b></span><i aria-hidden="true"></i><span>Zonder contact <b>${formatPercent(row.excludedWithoutContact)}</b></span></div><em>${percent.format(gap)} punt verschil in buitensluiting</em>`;
			return item;
		})
	);
}

function renderNationalConnection() {
	const metric = state.nationalConnectionMetric;
	const source = data.belonging.nationalConnection;
	const benchmark = source.metrics[metric].overall;
	const rows = source.profiles.filter((row) => row.group === state.nationalConnectionGroup).sort((a, b) => a.order - b.order);
	nationalConnectionProfiles.replaceChildren(
		...rows.map((row) => {
			const item = document.createElement("article");
			item.innerHTML = `<div><span>${row.label}</span><strong>${formatPercent(row[metric])}</strong></div><div class="national-connection-bar" aria-label="${source.metrics[metric].label}: ${formatPercent(row[metric])}; landelijk ${formatPercent(benchmark)}"><i style="width:${row[metric]}%"></i><b style="left:${benchmark}%" aria-hidden="true"></b></div>`;
			return item;
		})
	);
}

function renderHomeFeelingTrend() {
	const rows = data.belonging.homeFeelingTrend.rows;
	const groups = d3.groups(rows, (row) => row.group).map(([key, values]) => ({ key, label: values[0].label, values: values.sort((a, b) => a.year - b.year) }));
	const { width, height } = chartSize(homeFeelingTrendSvg, 340);
	const margin = { top: 24, right: 46, bottom: 48, left: 54 };
	const innerWidth = width - margin.left - margin.right;
	const innerHeight = height - margin.top - margin.bottom;
	homeFeelingTrendSvg.selectAll("*").remove();
	const root = homeFeelingTrendSvg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
	const x = d3.scaleLinear().domain([2006, 2020]).range([0, innerWidth]);
	const y = d3.scaleLinear().domain([50, 100]).range([innerHeight, 0]);
	root
		.append("g")
		.attr("class", "grid")
		.attr("transform", `translate(0,${innerHeight})`)
		.call(d3.axisBottom(x).tickValues([2006, 2010, 2015, 2020]).tickSize(-innerHeight).tickFormat(""));
	root
		.append("g")
		.attr("class", "axis")
		.call(
			d3
				.axisLeft(y)
				.ticks(5)
				.tickFormat((value) => `${value}%`)
		);
	root
		.append("g")
		.attr("class", "axis")
		.attr("transform", `translate(0,${innerHeight})`)
		.call(d3.axisBottom(x).tickValues([2006, 2010, 2015, 2020]).tickFormat(d3.format("d")));
	const line = d3
		.line()
		.x((row) => x(row.year))
		.y((row) => y(row.yes));
	const lineColors = { noMigrationBackground: "#3f8f86", migrationBackground: "#c95d4c" };
	for (const group of groups) {
		root.append("path").datum(group.values).attr("class", "home-feeling-line").attr("stroke", lineColors[group.key]).attr("d", line);
		root
			.selectAll(`circle.home-feeling-${group.key}`)
			.data(group.values)
			.join("circle")
			.attr("class", `home-feeling-point home-feeling-${group.key}`)
			.attr("fill", lineColors[group.key])
			.attr("cx", (row) => x(row.year))
			.attr("cy", (row) => y(row.yes))
			.attr("r", 6)
			.on("pointerenter", (event, row) => showTooltip(event, `${group.label} · ${row.year}`, [`Ja: ${formatPercent(row.yes)}`, `Soms: ${formatPercent(row.sometimes)}`, `Nee: ${formatPercent(row.no)}`]))
			.on("pointermove", moveTooltip)
			.on("pointerleave", hideTooltip);
		root
			.selectAll(`text.home-feeling-label-${group.key}`)
			.data(group.values)
			.join("text")
			.attr("class", "home-feeling-value")
			.attr("x", (row) => x(row.year))
			.attr("y", (row) => y(row.yes) - 11)
			.attr("text-anchor", "middle")
			.text((row) => `${row.yes}%`);
	}
}

function renderIdentityProfiles() {
	const source = data.belonging.identityProfiles;
	identityProfiles.replaceChildren(
		...source.profiles.map((row) => {
			const item = document.createElement("article");
			const strongDutch = row.both + row.netherlandsOnly;
			const description = source.categories.map((category) => `${category.label}: ${row[category.key]}%`).join(", ");
			item.innerHTML = `<div><span>${row.label}</span><strong>${strongDutch}% sterk Nederlander</strong></div><div class="identity-bar" aria-label="${description}">${source.categories.map((category) => `<i class="identity-${category.key}" style="width:${row[category.key]}%" title="${category.label}: ${row[category.key]}%"></i>`).join("")}</div>`;
			return item;
		})
	);
}

function renderIntegrationHistory() {
	const metric = state.integrationMetric;
	const allRows = data.belonging.integrationHistory;
	const groups = d3
		.groups(allRows, (row) => row.label)
		.map(([label, rows]) => ({ label, values: Object.fromEntries(rows.map((row) => [row.year, row[metric]])) }))
		.filter((row) => Number.isFinite(row.values[2006]) && Number.isFinite(row.values[2011]));
	const { width, height } = chartSize(integrationHistorySvg, Math.max(330, groups.length * 64 + 78));
	const margin = { top: 22, right: 62, bottom: 44, left: width < 620 ? 158 : 245 };
	const innerWidth = width - margin.left - margin.right;
	const innerHeight = height - margin.top - margin.bottom;
	integrationHistorySvg.selectAll("*").remove();
	const root = integrationHistorySvg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
	const x = d3.scaleLinear().domain([0, 100]).range([0, innerWidth]);
	const y = d3
		.scaleBand()
		.domain(groups.map((row) => row.label))
		.range([0, innerHeight])
		.padding(0.46);
	root.append("g").attr("class", "grid").attr("transform", `translate(0,${innerHeight})`).call(d3.axisBottom(x).ticks(5).tickSize(-innerHeight).tickFormat(""));
	root.append("g").attr("class", "axis integration-axis").call(d3.axisLeft(y).tickSize(0));
	root
		.append("g")
		.attr("class", "axis")
		.attr("transform", `translate(0,${innerHeight})`)
		.call(
			d3
				.axisBottom(x)
				.ticks(5)
				.tickFormat((value) => `${value}%`)
		);
	root
		.selectAll("line.integration-link")
		.data(groups)
		.join("line")
		.attr("class", (row) => `integration-link${row.values[2011] < row.values[2006] ? " is-down" : ""}`)
		.attr("x1", (row) => x(row.values[2006]))
		.attr("x2", (row) => x(row.values[2011]))
		.attr("y1", (row) => y(row.label) + y.bandwidth() / 2)
		.attr("y2", (row) => y(row.label) + y.bandwidth() / 2);
	for (const itemYear of [2006, 2011]) {
		root
			.selectAll(`circle.integration-${itemYear}`)
			.data(groups)
			.join("circle")
			.attr("class", `integration-point integration-${itemYear}`)
			.attr("cx", (row) => x(row.values[itemYear]))
			.attr("cy", (row) => y(row.label) + y.bandwidth() / 2)
			.attr("r", itemYear === 2011 ? 7 : 5)
			.on("pointerenter", (event, row) => showTooltip(event, `${row.label} · ${itemYear}`, [formatPercent(row.values[itemYear])]))
			.on("pointermove", moveTooltip)
			.on("pointerleave", hideTooltip);
	}
}

function renderBelonging() {
	renderBelongingStatements();
	renderBelongingSummary();
	renderBelongingProfiles();
	renderExclusionProfiles();
	renderBridgingContact();
	renderNationalConnection();
	renderHomeFeelingTrend();
	renderIdentityProfiles();
	renderIntegrationHistory();
}

function renderTrust() {
	const rows = [...data.trust2025].sort((a, b) => b.value - a.value);
	const { width, height } = chartSize(trustSvg, Math.max(520, rows.length * 39 + 56));
	const margin = { top: 16, right: 58, bottom: 34, left: width < 560 ? 112 : 146 };
	const innerWidth = width - margin.left - margin.right;
	const innerHeight = height - margin.top - margin.bottom;
	trustSvg.selectAll("*").remove();
	const root = trustSvg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
	const x = d3.scaleLinear().domain([0, 100]).range([0, innerWidth]);
	const y = d3
		.scaleBand()
		.domain(rows.map((row) => row.label))
		.range([0, innerHeight])
		.padding(0.3);
	const color = d3.scaleLinear().domain([20, 50, 80]).range(["#c95d4c", "#d4a44c", "#3f8f86"]).clamp(true);
	root.append("g").attr("class", "grid").attr("transform", `translate(0,${innerHeight})`).call(d3.axisBottom(x).ticks(5).tickSize(-innerHeight).tickFormat(""));
	root.append("g").attr("class", "axis trust-axis").call(d3.axisLeft(y).tickSize(0));
	root
		.append("g")
		.attr("class", "axis")
		.attr("transform", `translate(0,${innerHeight})`)
		.call(
			d3
				.axisBottom(x)
				.ticks(5)
				.tickFormat((value) => `${value}%`)
		);
	root
		.selectAll("rect.trust-bar")
		.data(rows)
		.join("rect")
		.attr("class", "trust-bar")
		.attr("x", 0)
		.attr("y", (row) => y(row.label))
		.attr("width", (row) => x(row.value))
		.attr("height", y.bandwidth())
		.attr("rx", 4)
		.attr("fill", (row) => color(row.value))
		.on("pointerenter", (event, row) => showTooltip(event, row.label, [formatPercent(row.value), intervalText(row)]))
		.on("pointermove", moveTooltip)
		.on("pointerleave", hideTooltip);
	root
		.selectAll("text.trust-value")
		.data(rows)
		.join("text")
		.attr("class", "trust-value")
		.attr("x", (row) => x(row.value) + 7)
		.attr("y", (row) => y(row.label) + y.bandwidth() / 2)
		.attr("dominant-baseline", "middle")
		.text((row) => formatPercent(row.value));

	const byKey = Object.fromEntries(rows.map((row) => [row.label, row]));
	const contrasts = [
		["Politie", "Politici"],
		["Gemeenteraad", "Tweede Kamer"],
		["Andere mensen", "Politici"],
	];
	trustContrast.replaceChildren(
		...contrasts.map(([high, low]) => {
			const difference = byKey[high].value - byKey[low].value;
			const item = document.createElement("article");
			item.innerHTML = `<span>${high} tegenover ${low}</span><strong>${percent.format(difference)} punt</strong><small>${formatPercent(byKey[high].value)} tegenover ${formatPercent(byKey[low].value)}</small>`;
			return item;
		})
	);
	renderTrustTrend();
}

function populateTrustTrendPicker() {
	const latestByKey = new Map();
	data.trustTrend.forEach((item) => {
		if (!latestByKey.has(item.key) || latestByKey.get(item.key).year < item.year) latestByKey.set(item.key, item);
	});
	const series = [...latestByKey.values()].sort((a, b) => b.value - a.value);
	trustTrendPicker.replaceChildren(
		...series.map((item) => {
			const button = document.createElement("button");
			button.type = "button";
			button.dataset.trustKey = item.key;
			button.textContent = item.label;
			button.style.setProperty("--series-color", trustTrendColors[item.key]);
			const active = state.trustTrendKeys.has(item.key);
			button.classList.toggle("is-active", active);
			button.setAttribute("aria-pressed", String(active));
			return button;
		})
	);
}

function renderTrustTrend() {
	const rows = data.trustTrend.filter((row) => state.trustTrendKeys.has(row.key));
	const series = d3
		.groups(rows, (row) => row.key)
		.map(([key, values]) => ({
			key,
			label: values[0].label,
			values: values.sort((a, b) => a.year - b.year),
		}));
	const { width, height } = chartSize(trustTrendSvg, 430);
	const margin = { top: 18, right: 24, bottom: 42, left: 52 };
	const innerWidth = width - margin.left - margin.right;
	const innerHeight = height - margin.top - margin.bottom;
	trustTrendSvg.selectAll("*").remove();
	if (!rows.length) return;

	const root = trustTrendSvg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
	const years = d3.extent(data.trustTrend, (row) => row.year);
	const x = d3.scaleLinear().domain(years).range([0, innerWidth]);
	const y = d3.scaleLinear().domain([0, 100]).range([innerHeight, 0]);
	const tickYears = d3.range(years[0], years[1] + 1).filter((itemYear) => width > 640 || itemYear % 2 === 0 || itemYear === years[1]);
	root.append("g").attr("class", "grid").call(d3.axisLeft(y).ticks(5).tickSize(-innerWidth).tickFormat(""));
	root
		.append("g")
		.attr("class", "axis")
		.call(
			d3
				.axisLeft(y)
				.ticks(5)
				.tickFormat((value) => `${value}%`)
		);
	root
		.append("g")
		.attr("class", "axis")
		.attr("transform", `translate(0,${innerHeight})`)
		.call(d3.axisBottom(x).tickValues(tickYears).tickFormat(d3.format("d")));

	const line = d3
		.line()
		.x((row) => x(row.year))
		.y((row) => y(row.value));
	root
		.selectAll("path.trust-trend-line")
		.data(series)
		.join("path")
		.attr("class", "trust-trend-line")
		.attr("stroke", (item) => trustTrendColors[item.key])
		.attr("d", (item) => line(item.values));
	root
		.selectAll("g.trust-trend-series")
		.data(series)
		.join("g")
		.attr("class", "trust-trend-series")
		.attr("fill", (item) => trustTrendColors[item.key])
		.selectAll("circle")
		.data((item) => item.values)
		.join("circle")
		.attr("class", "trust-trend-point")
		.attr("cx", (row) => x(row.year))
		.attr("cy", (row) => y(row.value))
		.attr("r", 4)
		.on("pointerenter", (event, row) => showTooltip(event, `${row.label} · ${row.year}`, [formatPercent(row.value), intervalText(row)]))
		.on("pointermove", moveTooltip)
		.on("pointerleave", hideTooltip);
}

function neighborhoodFor(regionKey, itemYear = state.neighborhoodYear) {
	return data.neighborhood.find((region) => region.key === regionKey)?.years.find((item) => item.year === itemYear);
}

function renderProvinceMap() {
	const provinces = data.neighborhood.filter((region) => region.key !== "NL01");
	const values = provinces.map((region) => neighborhoodFor(region.key)?.score.value).filter(Number.isFinite);
	const color = d3
		.scaleSequential()
		.domain([d3.min(values) - 0.1, d3.max(values) + 0.1])
		.interpolator(d3.interpolateRgbBasis(["#d86855", "#ddb55a", "#4b9a83"]));
	const cell = 92;
	const gap = 7;
	mapSvg.attr("viewBox", "0 0 390 485").attr("width", 390).attr("height", 485);
	mapSvg.selectAll("*").remove();
	const tiles = mapSvg
		.selectAll("g.province-tile")
		.data(provinces)
		.join("g")
		.attr("class", (region) => `province-tile${region.key === state.province ? " is-selected" : ""}`)
		.attr("transform", (region) => {
			const [column, row] = provinceTiles[region.label];
			return `translate(${column * (cell + gap)},${row * (cell + gap)})`;
		})
		.attr("role", "button")
		.attr("tabindex", 0)
		.attr("aria-label", (region) => `${region.label}: cohesiescore ${formatScore(neighborhoodFor(region.key)?.score.value)}`)
		.on("click", (_, region) => selectProvince(region.key))
		.on("keydown", (event, region) => {
			if (event.key === "Enter" || event.key === " ") selectProvince(region.key);
		})
		.on("pointerenter", (event, region) => {
			const score = neighborhoodFor(region.key)?.score;
			showTooltip(event, `${region.label} · ${state.neighborhoodYear}`, [`Cohesiescore: ${formatScore(score?.value)}`, intervalText(score)]);
		})
		.on("pointermove", moveTooltip)
		.on("pointerleave", hideTooltip);
	tiles
		.append("rect")
		.attr("width", cell)
		.attr("height", cell)
		.attr("rx", 12)
		.attr("fill", (region) => color(neighborhoodFor(region.key)?.score.value));
	tiles
		.append("text")
		.attr("class", "tile-name")
		.attr("x", cell / 2)
		.attr("y", 34)
		.attr("text-anchor", "middle")
		.text((region) => region.label.replace("Noord-", "N-").replace("Zuid-", "Z-").replace("Noord-Brabant", "N-Brabant"));
	tiles
		.append("text")
		.attr("class", "tile-score")
		.attr("x", cell / 2)
		.attr("y", 64)
		.attr("text-anchor", "middle")
		.text((region) => formatScore(neighborhoodFor(region.key)?.score.value));
}

function selectProvince(key) {
	state.province = key;
	renderProvinceMap();
	renderProvinceDetail();
}

function renderProvinceDetail() {
	const region = data.neighborhood.find((item) => item.key === state.province) || data.neighborhood[0];
	const selected = neighborhoodFor(region.key);
	const national = neighborhoodFor("NL01");
	provinceTitle.textContent = region.label;
	const scoreDelta = selected.score.value - national.score.value;
	provinceScore.innerHTML = `<strong>${formatScore(selected.score.value)}</strong><span>van 10</span><small>${region.key === "NL01" ? "Nederlandse schaalscore" : `${signed.format(scoreDelta)} ten opzichte van Nederland`}<br>${intervalText(selected.score)}</small>`;
	provinceItems.replaceChildren(
		...selected.items.map((item, index) => {
			const comparison = national.items[index];
			const itemElement = document.createElement("div");
			itemElement.className = item.key === "MensenKennenElkaarNauwelijks_7" ? "is-negative" : "";
			itemElement.innerHTML = `<div><span>${item.label}</span><strong>${formatPercent(item.value)}</strong></div><div class="profile-bar"><i style="width:${item.value}%"></i><b style="left:${comparison.value}%" title="Nederland: ${formatPercent(comparison.value)}"></b></div>`;
			return itemElement;
		})
	);
}

function populateProfileControls() {
	const groups = [...new Set(data.profiles2025.map((row) => row.group))];
	for (const group of groups) {
		const option = document.createElement("option");
		option.value = group;
		option.textContent = group;
		profileGroupSelect.append(option);
	}
	const metrics = ["socialContact", "volunteering", "informalHelp", "peopleTrust", "politicians", "secondChamber", "loneliness", "socialLoneliness", "emotionalLoneliness"];
	for (const metric of metrics) {
		const option = document.createElement("option");
		option.value = metric;
		option.textContent = metricInfo(metric).label;
		profileMetricSelect.append(option);
	}
	profileGroupSelect.value = state.profileGroup;
	profileMetricSelect.value = state.profileMetric;
}

function renderProfiles() {
	const rows = data.profiles2025.filter((row) => row.group === state.profileGroup).sort((a, b) => a.order - b.order);
	const metric = state.profileMetric;
	const values = rows.map((row) => row.metrics[metric]).filter((item) => Number.isFinite(item?.value));
	const { width, height } = chartSize(profileSvg, Math.max(420, rows.length * 62 + 78));
	const margin = { top: 20, right: 46, bottom: 44, left: width < 560 ? 130 : 190 };
	const innerWidth = width - margin.left - margin.right;
	const innerHeight = height - margin.top - margin.bottom;
	profileSvg.selectAll("*").remove();
	const root = profileSvg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
	const x = d3.scaleLinear().domain([0, 100]).range([0, innerWidth]);
	const y = d3
		.scaleBand()
		.domain(rows.map((row) => row.label))
		.range([0, innerHeight])
		.padding(0.42);
	root.append("g").attr("class", "grid").attr("transform", `translate(0,${innerHeight})`).call(d3.axisBottom(x).ticks(5).tickSize(-innerHeight).tickFormat(""));
	root.append("g").attr("class", "axis profile-axis").call(d3.axisLeft(y).tickSize(0));
	root
		.append("g")
		.attr("class", "axis")
		.attr("transform", `translate(0,${innerHeight})`)
		.call(
			d3
				.axisBottom(x)
				.ticks(5)
				.tickFormat((value) => `${value}%`)
		);
	root
		.selectAll("line.interval")
		.data(rows)
		.join("line")
		.attr("class", "interval")
		.attr("x1", (row) => x(row.metrics[metric]?.lower ?? row.metrics[metric]?.value ?? 0))
		.attr("x2", (row) => x(row.metrics[metric]?.upper ?? row.metrics[metric]?.value ?? 0))
		.attr("y1", (row) => y(row.label) + y.bandwidth() / 2)
		.attr("y2", (row) => y(row.label) + y.bandwidth() / 2);
	root
		.selectAll("circle.profile-dot")
		.data(rows)
		.join("circle")
		.attr("class", "profile-dot")
		.attr("cx", (row) => x(row.metrics[metric]?.value ?? 0))
		.attr("cy", (row) => y(row.label) + y.bandwidth() / 2)
		.attr("r", 7)
		.attr("fill", colors[metric] || "#6d78c8")
		.on("pointerenter", (event, row) => {
			const item = row.metrics[metric];
			showTooltip(event, row.label, [`${metricInfo(metric).label}: ${formatPercent(item.value)}`, intervalText(item)]);
		})
		.on("pointermove", moveTooltip)
		.on("pointerleave", hideTooltip);
	root
		.selectAll("text.profile-value")
		.data(rows)
		.join("text")
		.attr("class", "profile-value")
		.attr("x", (row) => x(row.metrics[metric]?.value ?? 0) + 11)
		.attr("y", (row) => y(row.label) + y.bandwidth() / 2)
		.attr("dominant-baseline", "middle")
		.text((row) => formatPercent(row.metrics[metric]?.value));

	const sorted = [...rows].filter((row) => Number.isFinite(row.metrics[metric]?.value)).sort((a, b) => a.metrics[metric].value - b.metrics[metric].value);
	const low = sorted[0];
	const high = sorted.at(-1);
	const gap = high.metrics[metric].value - low.metrics[metric].value;
	profileInsight.replaceChildren(
		...[
			["Hoogste", high.label, high.metrics[metric].value],
			["Laagste", low.label, low.metrics[metric].value],
			["Afstand", `${high.label} – ${low.label}`, gap],
		].map(([label, name, value]) => {
			const item = document.createElement("article");
			item.innerHTML = `<span>${label}</span><strong>${formatPercent(value)}</strong><small>${name}</small>`;
			return item;
		})
	);
}

function renderTab() {
	if (state.tab === "trend") renderTrend();
	if (state.tab === "history") renderHistory();
	if (state.tab === "belonging") renderBelonging();
	if (state.tab === "trust") renderTrust();
	if (state.tab === "neighborhood") {
		renderProvinceMap();
		renderProvinceDetail();
	}
	if (state.tab === "profiles") renderProfiles();
}

function setTab(tab) {
	state.tab = tab;
	tabButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.tab === tab));
	tabPanels.forEach((panel) => {
		const active = panel.id === `tab-${tab}`;
		panel.classList.toggle("is-active", active);
		panel.hidden = !active;
	});
	requestAnimationFrame(renderTab);
}

function bindEvents() {
	tabButtons.forEach((button) => button.addEventListener("click", () => setTab(button.dataset.tab)));
	trendMetricPicker.addEventListener("click", (event) => {
		const button = event.target.closest("button[data-metric]");
		if (!button) return;
		const metric = button.dataset.metric;
		if (state.trendMetrics.has(metric) && state.trendMetrics.size === 1) return;
		if (state.trendMetrics.has(metric)) state.trendMetrics.delete(metric);
		else state.trendMetrics.add(metric);
		button.classList.toggle("is-active", state.trendMetrics.has(metric));
		renderTrend();
	});
	trustTrendPicker.addEventListener("click", (event) => {
		const button = event.target.closest("button[data-trust-key]");
		if (!button) return;
		const key = button.dataset.trustKey;
		if (state.trustTrendKeys.has(key) && state.trustTrendKeys.size === 1) return;
		if (state.trustTrendKeys.has(key)) state.trustTrendKeys.delete(key);
		else state.trustTrendKeys.add(key);
		const active = state.trustTrendKeys.has(key);
		button.classList.toggle("is-active", active);
		button.setAttribute("aria-pressed", String(active));
		renderTrustTrend();
	});
	yearPicker.addEventListener("click", (event) => {
		const button = event.target.closest("button[data-year]");
		if (!button) return;
		state.neighborhoodYear = Number(button.dataset.year);
		yearPicker.querySelectorAll("button").forEach((item) => item.classList.toggle("is-active", item === button));
		renderProvinceMap();
		renderProvinceDetail();
	});
	profileGroupSelect.addEventListener("change", () => {
		state.profileGroup = profileGroupSelect.value;
		renderProfiles();
	});
	profileMetricSelect.addEventListener("change", () => {
		state.profileMetric = profileMetricSelect.value;
		renderProfiles();
	});
	belongingProfileGroupSelect.addEventListener("change", () => {
		state.belongingProfileGroup = belongingProfileGroupSelect.value;
		renderBelongingProfiles();
	});
	exclusionGroupSelect.addEventListener("change", () => {
		state.exclusionGroup = exclusionGroupSelect.value;
		renderExclusionProfiles();
	});
	nationalConnectionMetricSelect.addEventListener("change", () => {
		state.nationalConnectionMetric = nationalConnectionMetricSelect.value;
		renderNationalConnection();
	});
	nationalConnectionGroupSelect.addEventListener("change", () => {
		state.nationalConnectionGroup = nationalConnectionGroupSelect.value;
		renderNationalConnection();
	});
	integrationMetricSelect.addEventListener("change", () => {
		state.integrationMetric = integrationMetricSelect.value;
		renderIntegrationHistory();
	});
	let resizeFrame;
	window.addEventListener("resize", () => {
		cancelAnimationFrame(resizeFrame);
		resizeFrame = requestAnimationFrame(renderTab);
	});
}

async function init() {
	const response = await fetch("data.json");
	if (!response.ok) throw new Error(`Data laden mislukt (${response.status})`);
	data = await response.json();
	renderSnapshot();
	renderTrendStory();
	populateProfileControls();
	populateBelongingControls();
	populateTrustTrendPicker();
	bindEvents();
	renderTrend();
}

init().catch((error) => {
	console.error(error);
	document.querySelector(".cohesion-dashboard").innerHTML = `<section class="project-panel error-panel"><h2>De gegevens konden niet worden geladen</h2><p>${error.message}</p></section>`;
});
