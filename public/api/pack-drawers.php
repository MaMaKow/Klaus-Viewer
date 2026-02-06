<?php

declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

use KlausViewer\Database\DatabaseWrapper;

header('Content-Type: application/json; charset=utf-8');

$packCabinet = filter_input(INPUT_GET, 'packCabinet', FILTER_VALIDATE_INT);

if ($packCabinet === null || $packCabinet === false) {
    http_response_code(400);
    echo json_encode(
        ['error' => 'Missing or invalid packCabinet parameter.'],
        JSON_THROW_ON_ERROR
    );
    exit;
}

$result = DatabaseWrapper::instance()->run(
    'SELECT DISTINCT `PackDrawer` FROM `Stockinginfo` WHERE `PackCabinet` = :packCabinet ORDER BY `PackDrawer`',
    ['packCabinet' => $packCabinet]
);

$packDrawers = [];

while ($row = $result->fetch(PDO::FETCH_OBJ)) {
    $packDrawers[] = $row->PackDrawer;
}

echo json_encode(['packDrawers' => $packDrawers], JSON_THROW_ON_ERROR);
