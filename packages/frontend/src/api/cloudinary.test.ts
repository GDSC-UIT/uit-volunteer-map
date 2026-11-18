import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cloudinaryApi, imageFileError } from './cloudinary';
import { MEDIA_LIMITS } from '@uit-volunteer-map/shared';

let instances:FakeXHR[];
class FakeXHR {
 upload:{onprogress?: (event:{lengthComputable:boolean;loaded:number;total:number})=>void}={};
 status=200;responseText='';timeout=0;
 onload?:()=>void;onerror?:()=>void;ontimeout?:()=>void;onabort?:()=>void;
 open=vi.fn();send=vi.fn<(body?:FormData)=>void>();
 constructor(){instances.push(this);}
}
const file=(type='image/png',size=1)=>new File([new Uint8Array(size)],'fixture.png',{type});
const result={secure_url:'https://example.test/photo.png',public_id:'fixture',width:10,height:20};
beforeEach(()=>{instances=[];vi.stubGlobal('XMLHttpRequest',FakeXHR);vi.stubEnv('VITE_CLOUDINARY_CLOUD_NAME','fixture');vi.stubEnv('VITE_CLOUDINARY_UPLOAD_PRESET','fixture-only');});
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();vi.unstubAllEnvs();});
it.each(['image/svg+xml','text/plain','application/pdf',''])('rejects unsupported type %s before creating a provider request',async type=>{
 expect(imageFileError(file(type))).toBeTruthy();await expect(cloudinaryApi.uploadImage(file(type))).rejects.toThrow('JPEG');expect(instances).toHaveLength(0);
});
it.each([0,MEDIA_LIMITS.maxImageBytes+1])('rejects empty/oversized image of %i bytes before network',async size=>{
 await expect(cloudinaryApi.uploadImage(file('image/png',size))).rejects.toThrow('5 MiB');expect(instances).toHaveLength(0);
});
it('accepts the inclusive size limit',()=>expect(imageFileError(file('image/jpeg',MEDIA_LIMITS.maxImageBytes))).toBeUndefined());
it('preflights the complete batch and count before uploading any valid file',async()=>{
 await expect(cloudinaryApi.uploadImages([file(),file('image/svg+xml')])).rejects.toThrow();
 await expect(cloudinaryApi.uploadImages(Array.from({length:5},()=>file()))).rejects.toThrow('bốn');
 expect(instances).toHaveLength(0);
});
it('reports configuration errors before creating a provider request',async()=>{
 vi.stubEnv('VITE_CLOUDINARY_UPLOAD_PRESET','');
 await expect(cloudinaryApi.uploadImage(file())).rejects.toThrow('Cloudinary');expect(instances).toHaveLength(0);
});
it('uses only the existing Cloudinary endpoint, multipart body, timeout and progress callback',async()=>{
 const progress=vi.fn(),promise=cloudinaryApi.uploadImage(file(),progress),xhr=instances[0];
 expect(xhr.open).toHaveBeenCalledWith('POST','https://api.cloudinary.com/v1_1/fixture/image/upload');
 expect(xhr.send.mock.calls[0][0]).toBeInstanceOf(FormData);expect(xhr.timeout).toBe(60000);
 xhr.upload.onprogress!({lengthComputable:true,loaded:1,total:2});expect(progress).toHaveBeenCalledWith(50);
 xhr.responseText=JSON.stringify(result);xhr.onload!();await expect(promise).resolves.toEqual(result);
});
it.each(['invalid JSON','null',JSON.stringify({...result,secure_url:'javascript:alert(1)'}),JSON.stringify({...result,width:0}),JSON.stringify({...result,public_id:undefined})])('rejects malformed provider response without an uncaught callback exception: %s',async response=>{
 const promise=cloudinaryApi.uploadImage(file());instances[0].responseText=response;
 expect(()=>instances[0].onload!()).not.toThrow();await expect(promise).rejects.toThrow();
});
it.each(['onerror','ontimeout','onabort'] as const)('settles a failed request through %s',async event=>{
 const promise=cloudinaryApi.uploadImage(file());instances[0][event]!();await expect(promise).rejects.toThrow();
});
it('rejects a provider HTTP failure',async()=>{
 const promise=cloudinaryApi.uploadImage(file());instances[0].status=503;instances[0].onload!();await expect(promise).rejects.toThrow('Dịch vụ ảnh');
});
it('keeps successful batch progress observable before reporting a later failure',async()=>{
 const upload=vi.spyOn(cloudinaryApi,'uploadImage').mockResolvedValueOnce(result).mockRejectedValueOnce(new Error('fixture failure')),progress=vi.fn();
 await expect(cloudinaryApi.uploadImages([file(),file()],progress)).rejects.toThrow('fixture failure');
 expect(upload).toHaveBeenCalledTimes(2);
 expect(progress).toHaveBeenCalledWith(0,expect.objectContaining({status:'success',result}));
 expect(progress).toHaveBeenCalledWith(1,expect.objectContaining({status:'error'}));
});
