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

        <div class="no-data" id="no-data" style="display: none;">
            Keine Packungen in dieser Schublade vorhanden.
        </div>
    </div>

    <script src="js/app.js"></script>
</body>
</html>
