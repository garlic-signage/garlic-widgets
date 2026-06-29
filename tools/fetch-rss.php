<?php
/*************************************************************************************
 * fetch-rss.php: A very simple rss fetch solution to prevent SOP in webbrowser
 * fetch-rss is compatible to the old deprecated yahoo api for fetching rss
 *
 *
 * Copyright (C) 2020 Nikolaos Sagiadinos <ns@smil-control.com>
 *
 * This program is free software: you can redistribute it and/or  modify
 * it under the terms of the GNU Affero General Public License, version 3,
 * as published by the Free Software Foundation.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *************************************************************************************/

// set parameters

const _debug_mode = false;
const _http_host = ''; // make sure that not everyone can use this script to kill your traffic

// ===================================================

if(_debug_mode)
{
	ini_set('display_errors', true);
	error_reporting(E_ALL | E_STRICT);
}
else
{
	ini_set('display_errors', false);
	error_reporting(0);
}

if (empty(_http_host))
	die('set a http host');
if ($_SERVER['HTTP_HOST'] != _http_host)
	die('not correct http host');

$feed_url = $_GET['feed_url'] ?? '';
$feed_url = urldecode($feed_url);

if (!filter_var($feed_url, FILTER_VALIDATE_URL))
	die('Invalid URL');

$rss = simplexml_load_file($feed_url);
if(empty($rss))
{
	die('RSS Feed is empty');
}

// construct yahoo api structure
$items = array('query' => array('count' => 0, 'results' => array()));
foreach ($rss->channel->item as $item)
{
	$items['query']['results']['item'][] = (array) $item;
}
$items['query']['count'] = count($items['query']['results']['item']);

if(!_debug_mode)
{
	echo json_encode($items);
}
else
{
	echo '<pre>';print_r($items);
}	

exit();
