import { afterEach, beforeEach, expect, it } from 'vitest';
import { DataSource } from 'typeorm';
import { AddPhotoPosition1795017600000 } from './migrations/1795017600000-AddPhotoPosition.js';
let db:DataSource;
beforeEach(async()=>{
 db=new DataSource({type:'sqlite',database:':memory:',migrations:[AddPhotoPosition1795017600000]});await db.initialize();
 await db.query('PRAGMA foreign_keys=ON');await db.query('CREATE TABLE Post (PostId integer PRIMARY KEY)');
 await db.query('CREATE TABLE Photo (PhotoId integer PRIMARY KEY, PostID integer REFERENCES Post(PostId), ImageUrl text UNIQUE, isFirstImage integer, isDeleted integer DEFAULT 0)');
 await db.query('INSERT INTO Post VALUES (10),(20)');
 for(const [id,parent,first,deleted] of [[9,10,0,0],[7,10,1,1],[5,10,1,0],[3,10,1,0],[1,10,null,0],[11,20,0,0],[13,null,null,0]])await db.query('INSERT INTO Photo VALUES (?,?,?,?,?)',[id,parent,'https://example.test/'+id,first,deleted]);
});
afterEach(async()=>{if(db?.isInitialized)await db.destroy();});
it('backfills prior live presentation order and one first flag without losing rows or relations; restart is harmless',async()=>{
 const before=await db.query('SELECT PhotoId,PostID,ImageUrl,isDeleted FROM Photo ORDER BY PhotoId');
 expect(await db.runMigrations()).toHaveLength(1);expect(await db.runMigrations()).toHaveLength(0);
 expect(await db.query('SELECT PhotoId,PostID,ImageUrl,isDeleted FROM Photo ORDER BY PhotoId')).toEqual(before);
 expect((await db.query('SELECT PhotoId FROM Photo WHERE PostID=10 AND isDeleted=0 ORDER BY Position')).map((row:{PhotoId:number})=>row.PhotoId)).toEqual([3,5,1,9]);
 expect((await db.query('SELECT PhotoId FROM Photo WHERE isFirstImage=1 ORDER BY PhotoId')).map((row:{PhotoId:number})=>row.PhotoId)).toEqual([3,11]);
 expect(await db.query('PRAGMA foreign_key_check')).toEqual([]);
});
it('rolls back only Position and can reapply with populated FK-linked records intact',async()=>{
 const before=await db.query('SELECT PhotoId,PostID,ImageUrl,isDeleted FROM Photo ORDER BY PhotoId');
 await db.runMigrations();await db.undoLastMigration();expect(await db.query('SELECT PhotoId,PostID,ImageUrl,isDeleted FROM Photo ORDER BY PhotoId')).toEqual(before);
 await db.runMigrations();expect(await db.query('PRAGMA foreign_key_check')).toEqual([]);
});
