# !/usr/bin/python
# encoding=utf8

import os
import eyed3
import sqlite3
import datetime
import requests
import shutil
from bs4 import BeautifulSoup

import sys
reload(sys)
sys.setdefaultencoding('utf8')

import warnings
warnings.filterwarnings('ignore')

def download(url, dest):
    r = requests.get(url, stream=True)
    if r.status_code == 200:
        with open(dest, 'wb') as f:
            r.raw.decode_content = True
            shutil.copyfileobj(r.raw, f)

def downloadArtLastFM(artist, album):
    try:
        url = 'https://www.last.fm/music/%s/%s' % (artist, album);
        r = requests.get(url)
        if r.status_code == 200:
            soup = BeautifulSoup(r.text, "html.parser")
            li_imagen = soup.find('li', { 'class': 'secondary-nav-item--images' });
            a_imagen = li_imagen.find('a')
            link_imagen = 'https://www.last.fm%s' % (a_imagen.get('href'));

            r = requests.get(link_imagen)
            if r.status_code == 200:
                soup = BeautifulSoup(r.text, "html.parser")
                a_imagen = soup.find('a', { 'class': 'gallery-image' });
                img_imagen = a_imagen.find('img')
                url_imagen = img_imagen.get('src')
                download(url_imagen, os.path.join('..', '..', 'files/album-art', album + '.jpg'))
                return True
    except Exception as e:
        return False


downloadArtLastFM('ACDC', 'Back in Black')


def isMP3(filePath):
    fileName, fileExt = os.path.splitext(filePath)
    return fileExt=='.mp3'or fileExt=='.MP3'

def saveArtist(artist, cursor):
    cursor.execute('SELECT id, name FROM artist WHERE name=(?)', (artist,))
    check = cursor.fetchone()
    if check is not None:
        return { 'id': check[0], 'name': check[1] }
    else :
        query = """
            INSERT INTO
                {table} (name, createdAt, updatedAt)
            VALUES (?, ?, ?)
        """.format(table='artist')
        cursor.execute(query, (artist, datetime.datetime.now(), datetime.datetime.now()))
        return { 'id': cursor.lastrowid, 'name': artist }

def saveAlbum(artist, album, search_art, cursor):
    cursor.execute('SELECT id, art FROM album WHERE artistId=(?) AND name=(?)', (artist['id'], album['name'],))
    check = cursor.fetchone()
    if not search_art:
        art = 0
    if check is None:
        if search_art:
            art = downloadArtLastFM(artist['name'], album['name'])
        query = """
            INSERT INTO
                {table} (name, year, art, artistId, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?)
        """.format(table='album')
        cursor.execute(query, (album['name'], album['year'], art, artist['id'], datetime.datetime.now(), datetime.datetime.now()))
        return cursor.lastrowid
    else:
        if (not check[1] and search_art):
            art = downloadArtLastFM(artist['name'], album['name'])
            cursor.execute('UPDATE album SET art=? WHERE id=?', (art, check[0],))
        return check[0]

def saveSong(folder, artist, album, song, cursor):
    cursor.execute('SELECT id FROM song WHERE artistId=(?) AND albumId=(?) AND name=(?)', (artist['id'], album, song['name'],))
    check = cursor.fetchone()
    if check is None:
        query = """
            INSERT INTO
                {table} (name, track, uri, size, duration, albumId, artistId, folderId, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """.format(table='song')
        cursor.execute(query, (song['name'], song['track'], song['uri'], song['size'], song['duration'], album, artist['id'], folder, datetime.datetime.now(), datetime.datetime.now()))
        return cursor.lastrowid
    else:
        return check[0]

def saveFolder(path, search_art, cursor):
    cursor.execute('SELECT id FROM folder WHERE path=(?)', (path,))
    check = cursor.fetchone()
    if check is None:
        query = """
            INSERT INTO
                {table} (path, search_art, scanned, last_scan, scan_finished, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """.format(table='folder')
        cursor.execute(query, (path, search_art, 0, '', 0, datetime.datetime.now(), datetime.datetime.now(), ))
        return cursor.lastrowid
    else:
        return check[0]

def process(file, folder, search_art, conn, cursor):
    tag_data = eyed3.core.load(file)
    saved_artist = saveArtist(tag_data.tag.artist, cursor)
    album = { 'name': tag_data.tag.album, 'year': int(tag_data.tag.best_release_date.year) if tag_data.tag.best_release_date != None else 0 }
    id_album = saveAlbum(saved_artist, album, search_art, cursor)
    song = {
        'name': unicode(tag_data.tag.title),
        'track': tag_data.tag.track_num[0],
        'uri': unicode(str(file)),
        'size': os.stat(file).st_size ,
        'duration': '',
    }
    saveSong(folder, saved_artist, id_album, song, cursor)
    conn.commit()

def create_tables():
    conn = sqlite3.connect('../../database.sqlite')
    cursor = conn.cursor()
    create_table_folder = '''CREATE TABLE `folder` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `path` VARCHAR(255),
        `search_art` TINYINT(1), `scanned` TINYINT(1), `scan_finished` TINYINT(1), `last_scan` DATETIME,
        `createdAt` DATETIME, `updatedAt` DATETIME)'''

    create_table_artist = '''CREATE TABLE `artist`
        (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `name` VARCHAR(255), `createdAt` DATETIME, `updatedAt` DATETIME)'''

    create_table_album = '''CREATE TABLE `album` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `name` VARCHAR(255),
        `year` INTEGER(4), `art` TINYINT(1), `createdAt` DATETIME, `updatedAt` DATETIME,
        `artistId` INTEGER REFERENCES `artist` (`id`) ON DELETE CASCADE ON UPDATE CASCADE)'''

    create_table_song = '''CREATE TABLE `song` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `name` VARCHAR(255),
        `track` INTEGER(2), `uri` VARCHAR(255), `size` FLOAT, `duration` FLOAT,
        `createdAt` DATETIME, `updatedAt` DATETIME,
        `albumId` INTEGER REFERENCES `album` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
        `folderId` INTEGER REFERENCES `folder` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
        `artistId` INTEGER REFERENCES `artist` (`id`) ON DELETE SET NULL ON UPDATE CASCADE)'''

    conn.execute(create_table_folder)
    conn.execute(create_table_artist)
    conn.execute('''CREATE UNIQUE INDEX i_name ON artist (name)''')
    conn.execute(create_table_album)
    conn.execute(create_table_song)


def scan(path, search_art):
    conn = sqlite3.connect('../../database.sqlite')
    cursor = conn.cursor();

    id_folder = saveFolder(path, search_art, cursor)
    query = """
        UPDATE
            folder SET scanned=1, last_scan=?, scan_finished=0, updatedAt=?, search_art=?
            WHERE id=?
        """
    cursor.execute(query, (datetime.datetime.now(), datetime.datetime.now(), search_art, id_folder))
    conn.commit()

    for root, dirs, files in os.walk(path, topdown=False):
        for name in files:
            if isMP3(name):
                print name
                process(os.path.join(root, name), id_folder, search_art, conn, cursor)
    cursor.execute('UPDATE folder SET scan_finished=1 WHERE id=?', (id_folder,))
    conn.commit()
    conn.close()

scan("/media/datos/Musica/Discos/ACDC", 1)
