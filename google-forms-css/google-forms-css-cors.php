<?php

/*

  google-forms-css

*/

// validate
if (!preg_match('/^https:\/\/docs.google.com\/forms\/.*/', $_GET['url'])) {
  http_response_code(400);
  die('invalid url');
}

echo file_get_contents($_GET['url']);

?>
