import { afterEach, beforeEach, expect, it } from 'vitest';
import { DataSource } from 'typeorm';
import { AddPostCoordinates1794931200000 } from './migrations/1794931200000-AddPostCoordinates.js';

let db: DataSource;
beforeEach(async () => {
  db = new DataSource({type:'sqlite',database:':memory:',migrations:[AddPostCoordinates1794931200000]});
  await db.initialize();
  await db.query('PRAGMA foreign_keys = ON');
  await db.query('CREATE TABLE Team (TeamId integer PRIMARY KEY)');
  await db.query('CREATE TABLE User (UserId integer PRIMARY KEY)');
  await db.query(`CREATE TABLE Post (PostId integer PRIMARY KEY AUTOINCREMENT, Title text NOT NULL, Content text NOT NULL,
    IsDeleted integer NOT NULL DEFAULT 0, CreatedAt text NOT NULL, UpdatedAt text NOT NULL,
    TeamId integer REFERENCES Team(TeamId), AuthorId integer REFERENCES User(UserId))`);
  await db.query('CREATE TABLE Photo (PhotoId integer PRIMARY KEY, ImageUrl text NOT NULL, PostID integer REFERENCES Post(PostId))');
  await db.query('INSERT INTO Team VALUES (10)');
  await db.query('INSERT INTO User VALUES (11)');
  await db.query("INSERT INTO Post VALUES (1001, 'Legacy post', 'Keep content', 0, '2026-01-01', '2026-01-01', 10, 11)");
  await db.query("INSERT INTO Photo VALUES (1, 'https://example.test/p.png', 1001)");
});
afterEach(async () => {if(db?.isInitialized) await db.destroy();});

it('upgrades populated posts without rebuilding parents or inventing locations; replay is a no-op', async () => {
  const photos = await db.query('SELECT * FROM Photo');
  expect(await db.runMigrations()).toHaveLength(1);
  expect(await db.runMigrations()).toHaveLength(0);
  expect(await db.query('SELECT PostId, Title, Content, TeamId, AuthorId, Latitude, Longitude FROM Post')).toEqual([
    {PostId:1001,Title:'Legacy post',Content:'Keep content',TeamId:10,AuthorId:11,Latitude:null,Longitude:null},
  ]);
  expect(await db.query('SELECT * FROM Photo')).toEqual(photos);
  expect(await db.query('PRAGMA foreign_key_check')).toEqual([]);
  await expect(db.query('UPDATE Post SET Longitude = 106')).rejects.toThrow();
  await expect(db.query('UPDATE Post SET Latitude = 10, Longitude = 181')).rejects.toThrow();
  await db.query('UPDATE Post SET Latitude = 0, Longitude = 0');
  expect(await db.query('SELECT Latitude, Longitude FROM Post')).toEqual([{Latitude:0,Longitude:0}]);
});

it('rolls back and reapplies on populated FK-linked data, discarding only the new coordinates', async () => {
  const posts = await db.query('SELECT * FROM Post'), photos = await db.query('SELECT * FROM Photo');
  await db.runMigrations();
  await db.query('UPDATE Post SET Latitude = 10.8, Longitude = 106.6');
  await db.undoLastMigration();
  expect(await db.query('SELECT * FROM Post')).toEqual(posts);
  expect(await db.query('SELECT * FROM Photo')).toEqual(photos);
  expect(await db.query('PRAGMA foreign_key_check')).toEqual([]);
  await db.runMigrations();
  expect(await db.query('SELECT Latitude, Longitude FROM Post')).toEqual([{Latitude:null,Longitude:null}]);
});
