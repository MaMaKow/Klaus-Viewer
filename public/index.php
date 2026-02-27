<!DOCTYPE html>
<?php
$apiBaseUrl = 'api';
?>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lagerverwaltungssystem - Schubladenvisualisierung</title>
    <link rel="stylesheet" type="text/css" href="style.css" media="all">
</head>
<body data-api-base-url="<?= htmlspecialchars($apiBaseUrl, ENT_QUOTES, 'UTF-8'); ?>">
    <div class="container">
        <h1>Lagerverwaltungssystem - Schubladenvisualisierung</h1>

        <div class="controls">
            <div class="control-group">
                <label for="cabinet-select">Schrank auswählen:</label>
                <select id="cabinet-select">
                    <option value="">Bitte wählen Sie einen Schrank</option>
                </select>
            </div>

            <div class="control-group">
                <label for="drawer-select">Schublade auswählen:</label>
                <select id="drawer-select" disabled>
                    <option value="">Bitte wählen Sie eine Schublade</option>
                </select>
            </div>

            <button id="visualize-btn" disabled>Visualisieren</button>
        </div>

        <div class="search-controls">
            <div class="control-group">
                <label for="search-query">Suche:</label>
                <input
                    id="search-query"
                    type="text"
                    placeholder="z. B. 12345, CHARGE-01 oder SERIAL"
                >
            </div>

            <div class="control-group">
                <label for="search-field">Suchfeld:</label>
                <select id="search-field">
                    <option value="all">Alle Felder</option>
                    <option value="PackId">PackId</option>
                    <option value="ArticleId">PZN</option>
                    <option value="PackBatchNo">Charge</option>
                    <option value="PackSerialNo">Seriennummer</option>
                    <option value="Description">Bezeichnung</option>
                </select>
            </div>

            <div class="control-group checkbox-group">
                <label for="global-search-checkbox">Bereich:</label>
                <label class="checkbox-label">
                    <input id="global-search-checkbox" type="checkbox" checked=checked>
                    Im gesamten Kommissionierautomaten suchen
                </label>
            </div>

            <button id="search-btn">Suchen</button>
            <button id="reset-search-btn">Suche zurücksetzen</button>
            <button id="outlier-btn">Ausreißer anzeigen</button>
        </div>

        <div class="search-status" id="search-status" style="display: none;"></div>

        <div class="loading" id="loading" style="display: none;">
            Lade Daten...
        </div>

        <div class="visualization" id="visualization-container" style="display: none;">
            <h2 id="drawer-title">Schublade #</h2>
            <div class="drawer-container" id="drawer"></div>
            <div class="last-update" id="last-update">Letzte Aktualisierung: -</div>

            <div class="info-panel">
                <h3>Informationen zur Schublade:</h3>
                <div id="drawer-info"></div>
            </div>

            <div class="package-details" id="package-details" style="display: none;">
                <h3>Details der ausgewählten Packung:</h3>
                <div class="package-info" id="package-info"></div>
            </div>
        </div>

        <div class="search-results" id="search-results" style="display: none;">
            <h2>Suchergebnisse im Kommissionierautomaten</h2>
            <div class="results-table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>PackId</th>
                            <th>PZN</th>
                            <th>Charge</th>
                            <th>Seriennummer</th>
                            <th>Schrank</th>
                            <th>Schublade</th>
                            <th>Beschreibung</th>
                            <th>Aktion</th>
                        </tr>
                    </thead>
                    <tbody id="search-results-body"></tbody>
                </table>
            </div>
        </div>

        <div class="search-results" id="outlier-results" style="display: none;">
            <h2>Ausreißer (Abweichung &gt; 10 mm vom Median je PZN)</h2>
            <div class="results-table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>PackId</th>
                            <th>PZN</th>
                            <th>Beschreibung</th>
                            <th>Schrank</th>
                            <th>Schublade</th>
                            <th>Länge (Δ)</th>
                            <th>Breite (Δ)</th>
                            <th>Höhe (Δ)</th>
                        </tr>
                    </thead>
                    <tbody id="outlier-results-body"></tbody>
                </table>
            </div>
        </div>

        <div class="no-data" id="no-data" style="display: none;"></div>
    </div>

    <script src="js/app.js"></script>
</body>
</html>
