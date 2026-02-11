<?php
require_once __DIR__ . '/lib/Database.php';
require_once __DIR__ . '/lib/Response.php';

$configPath = __DIR__ . '/config.php';
if (!file_exists($configPath)) {
    Response::error('Config mancante: copia config.php.example in config.php', 'CONFIG_MISSING', 500);
    exit;
}

$config = require $configPath;

// CORS
header('Access-Control-Allow-Origin: ' . $config['cors']['allowed_origins']);
header('Access-Control-Allow-Methods: ' . $config['cors']['allowed_methods']);
header('Access-Control-Allow-Headers: ' . $config['cors']['allowed_headers']);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

try {
    $database = new Database($config);
    $pdo = $database->getConnection();
} catch (PDOException $exception) {
    Response::error('Errore connessione database: verifica credenziali e stato del container MySQL.', 'DB_CONNECTION_ERROR', 500);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = rtrim($uri, '/');

$basePath = '/api';
if (!str_starts_with($uri, $basePath)) {
    Response::error('Endpoint non trovato', 'NOT_FOUND', 404);
    exit;
}

$path = trim(substr($uri, strlen($basePath)), '/');
$segments = $path === '' ? [] : explode('/', $path);
$resource = $segments[0] ?? '';
$resourceId = $segments[1] ?? null;

$input = json_decode(file_get_contents('php://input'), true) ?? [];

switch ($resource) {
    case 'boards':
        handleBoards($pdo, $method, $resourceId, $input);
        break;
    case 'lists':
        handleLists($pdo, $method, $resourceId, $input);
        break;
    case 'cards':
        handleCards($pdo, $method, $resourceId, $input);
        break;
    case 'members':
        handleMembers($pdo, $method, $resourceId, $input);
        break;
    case 'card-assignments':
        handleCardAssignments($pdo, $method, $input);
        break;
    default:
        Response::error('Endpoint non trovato', 'NOT_FOUND', 404);
}

function handleBoards(PDO $pdo, string $method, ?string $id, array $input): void
{
    if ($method === 'GET' && $id === null) {
        $stmt = $pdo->query('SELECT * FROM boards ORDER BY created_at DESC');
        Response::json($stmt->fetchAll());
        return;
    }

    if ($method === 'GET' && $id !== null) {
        $stmt = $pdo->prepare('SELECT * FROM boards WHERE id = ?');
        $stmt->execute([$id]);
        $board = $stmt->fetch();
        if (!$board) {
            Response::error('Board non trovata', 'BOARD_NOT_FOUND', 404);
            return;
        }
        Response::json($board);
        return;
    }

    if ($method === 'POST') {
        if (empty($input['titolo'])) {
            Response::error('Titolo obbligatorio', 'VALIDATION_ERROR', 422);
            return;
        }

        $stmt = $pdo->prepare('INSERT INTO boards (titolo, descrizione) VALUES (?, ?)');
        $stmt->execute([$input['titolo'], $input['descrizione'] ?? null]);
        $id = (int) $pdo->lastInsertId();
        Response::json(['id' => $id], 201);
        return;
    }

    if ($method === 'PUT' && $id !== null) {
        $stmt = $pdo->prepare('UPDATE boards SET titolo = ?, descrizione = ? WHERE id = ?');
        $stmt->execute([
            $input['titolo'] ?? null,
            $input['descrizione'] ?? null,
            $id,
        ]);
        Response::json(['updated' => $stmt->rowCount() > 0]);
        return;
    }

    if ($method === 'DELETE' && $id !== null) {
        $stmt = $pdo->prepare('DELETE FROM boards WHERE id = ?');
        $stmt->execute([$id]);
        Response::json(['deleted' => $stmt->rowCount() > 0]);
        return;
    }

    Response::error('Metodo non supportato', 'METHOD_NOT_ALLOWED', 405);
}

function handleLists(PDO $pdo, string $method, ?string $id, array $input): void
{
    if ($method === 'GET' && $id === null) {
        $boardId = $_GET['board_id'] ?? null;
        if ($boardId !== null) {
            $stmt = $pdo->prepare('SELECT * FROM lists WHERE board_id = ? ORDER BY posizione ASC');
            $stmt->execute([$boardId]);
        } else {
            $stmt = $pdo->query('SELECT * FROM lists ORDER BY board_id ASC, posizione ASC');
        }
        Response::json($stmt->fetchAll());
        return;
    }

    if ($method === 'GET' && $id !== null) {
        $stmt = $pdo->prepare('SELECT * FROM lists WHERE id = ?');
        $stmt->execute([$id]);
        $list = $stmt->fetch();
        if (!$list) {
            Response::error('Lista non trovata', 'LIST_NOT_FOUND', 404);
            return;
        }
        Response::json($list);
        return;
    }

    if ($method === 'POST') {
        if (empty($input['board_id']) || empty($input['titolo'])) {
            Response::error('Board e titolo obbligatori', 'VALIDATION_ERROR', 422);
            return;
        }

        $stmt = $pdo->prepare('INSERT INTO lists (board_id, titolo, posizione) VALUES (?, ?, ?)');
        $stmt->execute([
            $input['board_id'],
            $input['titolo'],
            $input['posizione'] ?? 0,
        ]);
        $id = (int) $pdo->lastInsertId();
        Response::json(['id' => $id], 201);
        return;
    }

    if ($method === 'PUT' && $id !== null) {
        $stmt = $pdo->prepare('UPDATE lists SET titolo = ?, posizione = ? WHERE id = ?');
        $stmt->execute([
            $input['titolo'] ?? null,
            $input['posizione'] ?? 0,
            $id,
        ]);
        Response::json(['updated' => $stmt->rowCount() > 0]);
        return;
    }

    if ($method === 'DELETE' && $id !== null) {
        $stmt = $pdo->prepare('DELETE FROM lists WHERE id = ?');
        $stmt->execute([$id]);
        Response::json(['deleted' => $stmt->rowCount() > 0]);
        return;
    }

    Response::error('Metodo non supportato', 'METHOD_NOT_ALLOWED', 405);
}

function handleCards(PDO $pdo, string $method, ?string $id, array $input): void
{
    ensureCardsTableExists($pdo);
    $hasAssigneeColumn = cardsHasAssigneeColumn($pdo);
    
    if ($method === 'GET' && $id === null) {
        $listId = $_GET['list_id'] ?? null;
        $selectFields = $hasAssigneeColumn
            ? 'id, list_id, titolo, descrizione, assegnatario, posizione, created_at, updated_at'
            : 'id, list_id, titolo, descrizione, NULL AS assegnatario, posizione, created_at, updated_at';
        
        if ($listId !== null) {
            $stmt = $pdo->prepare("SELECT $selectFields FROM cards WHERE list_id = ? ORDER BY posizione ASC");
            $stmt->execute([$listId]);
        } else {
            $stmt = $pdo->query("SELECT $selectFields FROM cards ORDER BY list_id ASC, posizione ASC");
        }
        Response::json($stmt->fetchAll());
        return;
    }

    if ($method === 'GET' && $id !== null) {
        $selectFields = $hasAssigneeColumn
            ? 'id, list_id, titolo, descrizione, assegnatario, posizione, created_at, updated_at'
            : 'id, list_id, titolo, descrizione, NULL AS assegnatario, posizione, created_at, updated_at';

        $stmt = $pdo->prepare("SELECT $selectFields FROM cards WHERE id = ?");
        $stmt->execute([$id]);
        $card = $stmt->fetch();
        if (!$card) {
            Response::error('Card non trovata', 'CARD_NOT_FOUND', 404);
            return;
        }
        Response::json($card);
        return;
    }

    if ($method === 'POST') {
        if (empty($input['list_id']) || empty($input['titolo'])) {
            Response::error('Lista e titolo obbligatori', 'VALIDATION_ERROR', 422);
            return;
        }

        if ($hasAssigneeColumn) {
            $stmt = $pdo->prepare('INSERT INTO cards (list_id, titolo, descrizione, assegnatario, posizione) VALUES (?, ?, ?, ?, ?)');
            $stmt->execute([
                $input['list_id'],
                $input['titolo'],
                $input['descrizione'] ?? null,
                $input['assegnatario'] ?? null,
                $input['posizione'] ?? 0,
            ]);
        } else {
            $stmt = $pdo->prepare('INSERT INTO cards (list_id, titolo, descrizione, posizione) VALUES (?, ?, ?, ?)');
            $stmt->execute([
                $input['list_id'],
                $input['titolo'],
                $input['descrizione'] ?? null,
                $input['posizione'] ?? 0,
            ]);
        }
        
        $id = (int) $pdo->lastInsertId();
        Response::json(['id' => $id], 201);
        return;
    }

    if ($method === 'PUT' && $id !== null) {
        if ($hasAssigneeColumn) {
            $stmt = $pdo->prepare('UPDATE cards SET titolo = ?, descrizione = ?, assegnatario = ?, list_id = ?, posizione = ? WHERE id = ?');
            $stmt->execute([
                $input['titolo'] ?? null,
                $input['descrizione'] ?? null,
                $input['assegnatario'] ?? null,
                $input['list_id'] ?? null,
                $input['posizione'] ?? 0,
                $id,
            ]);
        } else {
            $stmt = $pdo->prepare('UPDATE cards SET titolo = ?, descrizione = ?, list_id = ?, posizione = ? WHERE id = ?');
            $stmt->execute([
                $input['titolo'] ?? null,
                $input['descrizione'] ?? null,
                $input['list_id'] ?? null,
                $input['posizione'] ?? 0,
                $id,
            ]);
        }

        Response::json(['updated' => $stmt->rowCount() > 0]);
        return;
    }

    if ($method === 'DELETE' && $id !== null) {
        $stmt = $pdo->prepare('DELETE FROM cards WHERE id = ?');
        $stmt->execute([$id]);
        Response::json(['deleted' => $stmt->rowCount() > 0]);
        return;
    }

    Response::error('Metodo non supportato', 'METHOD_NOT_ALLOWED', 405);
}

require_once __DIR__ . '/lib/Database.php';
require_once __DIR__ . '/lib/Response.php';

$configPath = __DIR__ . '/config.php';
if (!file_exists($configPath)) {
    Response::error('Config mancante: copia config.php.example in config.php', 'CONFIG_MISSING', 500);
    exit;
}

$config = require $configPath;

// CORS
header('Access-Control-Allow-Origin: ' . $config['cors']['allowed_origins']);
header('Access-Control-Allow-Methods: ' . $config['cors']['allowed_methods']);
header('Access-Control-Allow-Headers: ' . $config['cors']['allowed_headers']);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$database = new Database($config);
$pdo = $database->getConnection();
try {
    $database = new Database($config);
    $pdo = $database->getConnection();
} catch (PDOException $exception) {
    Response::error('Errore connessione database: verifica credenziali e stato del container MySQL.', 'DB_CONNECTION_ERROR', 500);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = rtrim($uri, '/');

$basePath = '/api';
if (!str_starts_with($uri, $basePath)) {
    Response::error('Endpoint non trovato', 'NOT_FOUND', 404);
    exit;
}

$path = trim(substr($uri, strlen($basePath)), '/');
$segments = $path === '' ? [] : explode('/', $path);
$resource = $segments[0] ?? '';
$resourceId = $segments[1] ?? null;

$input = json_decode(file_get_contents('php://input'), true) ?? [];

switch ($resource) {
    case 'boards':
        handleBoards($pdo, $method, $resourceId, $input);
        break;
    case 'lists':
        handleLists($pdo, $method, $resourceId, $input);
        break;
@@ -158,50 +163,51 @@ function handleLists(PDO $pdo, string $method, ?string $id, array $input): void
    }

    if ($method === 'PUT' && $id !== null) {
        $stmt = $pdo->prepare('UPDATE lists SET titolo = ?, posizione = ? WHERE id = ?');
        $stmt->execute([
            $input['titolo'] ?? null,
            $input['posizione'] ?? 0,
            $id,
        ]);
        Response::json(['updated' => $stmt->rowCount() > 0]);
        return;
    }

    if ($method === 'DELETE' && $id !== null) {
        $stmt = $pdo->prepare('DELETE FROM lists WHERE id = ?');
        $stmt->execute([$id]);
        Response::json(['deleted' => $stmt->rowCount() > 0]);
        return;
    }

    Response::error('Metodo non supportato', 'METHOD_NOT_ALLOWED', 405);
}

function ensureCardsTableExists(PDO $pdo): void
{
    static $alreadyEnsured = false;

    if ($alreadyEnsured) {
        return;
    }

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS cards (
            id INT AUTO_INCREMENT PRIMARY KEY,
            list_id INT NOT NULL,
            titolo VARCHAR(160) NOT NULL,
            descrizione TEXT NULL,
            assegnatario VARCHAR(160) NULL,
            posizione INT NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_cards_list FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
            INDEX idx_cards_list_posizione (list_id, posizione)
        ) ENGINE=InnoDB'
    );

    $alreadyEnsured = true;
}


function cardsHasAssigneeColumn(PDO $pdo): bool
{
    static $cachedResult = null;

    if ($cachedResult !== null) {
        return $cachedResult;
    }

    $stmt = $pdo->query("SHOW COLUMNS FROM cards LIKE 'assegnatario'");
    $cachedResult = $stmt->fetch() !== false;

    return $cachedResult;
}

function handleMembers(PDO $pdo, string $method, ?string $id, array $input): void
{
    if ($method === 'GET' && $id === null) {
        $stmt = $pdo->query('SELECT * FROM members ORDER BY nome ASC');
        Response::json($stmt->fetchAll());
        return;
    }

    if ($method === 'GET' && $id !== null) {
        $stmt = $pdo->prepare('SELECT * FROM members WHERE id = ?');
        $stmt->execute([$id]);
        $member = $stmt->fetch();
        if (!$member) {
            Response::error('Membro non trovato', 'MEMBER_NOT_FOUND', 404);
            return;
        }
        Response::json($member);
        return;
    }

    if ($method === 'POST') {
        if (empty($input['nome'])) {
            Response::error('Nome obbligatorio', 'VALIDATION_ERROR', 422);
            return;
        }

        $stmt = $pdo->prepare('INSERT INTO members (nome, email) VALUES (?, ?)');
        $stmt->execute([
            $input['nome'],
            $input['email'] ?? null,
        ]);
        $id = (int) $pdo->lastInsertId();
        Response::json(['id' => $id], 201);
        return;
    }

    if ($method === 'PUT' && $id !== null) {
        $stmt = $pdo->prepare('UPDATE members SET nome = ?, email = ? WHERE id = ?');
        $stmt->execute([
            $input['nome'] ?? null,
            $input['email'] ?? null,
            $id,
        ]);
        Response::json(['updated' => $stmt->rowCount() > 0]);
        return;
    }

    if ($method === 'DELETE' && $id !== null) {
        $stmt = $pdo->prepare('DELETE FROM members WHERE id = ?');
        $stmt->execute([$id]);
        Response::json(['deleted' => $stmt->rowCount() > 0]);
        return;
    }

    Response::error('Metodo non supportato', 'METHOD_NOT_ALLOWED', 405);
}

function handleCardAssignments(PDO $pdo, string $method, array $input): void
{
    if ($method === 'POST') {
        if (empty($input['card_id']) || empty($input['member_id'])) {
            Response::error('Card e membro obbligatori', 'VALIDATION_ERROR', 422);
            return;
        }

        $stmt = $pdo->prepare('INSERT INTO card_members (card_id, member_id) VALUES (?, ?)');
        $stmt->execute([
            $input['card_id'],
            $input['member_id'],
        ]);
        Response::json(['assigned' => true], 201);
        return;
    }

    if ($method === 'DELETE') {
        if (empty($input['card_id']) || empty($input['member_id'])) {
            Response::error('Card e membro obbligatori', 'VALIDATION_ERROR', 422);
            return;
        }

        $stmt = $pdo->prepare('DELETE FROM card_members WHERE card_id = ? AND member_id = ?');
        $stmt->execute([
            $input['card_id'],
            $input['member_id'],
        ]);
        Response::json(['deleted' => $stmt->rowCount() > 0]);
        return;
    }

    Response::error('Metodo non supportato', 'METHOD_NOT_ALLOWED', 405);
}
