<?php

header("Access-Control-Allow-Origin: *");
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400');
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

// echo '_POST=';  print_r($_POST);

echo "<table>
<thead>
  <tr>
    <th>Name</th>
    <th>Value</th>
  </tr>
</thead>
<tbody>\n";

foreach ($_POST as $key => $val) {
    echo "<tr id=\"$key\">\n";
    echo "<td class=\"key\">$key</td>\n";
    echo "<td class=\"val\">$val</td>\n";
    echo "</tr>\n";
}

echo "</tbody>
</table>\n";
