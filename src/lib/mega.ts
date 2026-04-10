import { File, Storage } from "megajs";

let storage: Storage | null = null;

export async function getMegaStorage() {
  if (storage && (storage as any).ready) return storage;

  const email = process.env.MEGA_EMAIL;
  const password = process.env.MEGA_PASSWORD;

  if (!email || !password) {
    throw new Error("MEGA_EMAIL and MEGA_PASSWORD must be set in .env");
  }

  return new Promise<Storage>((resolve, reject) => {
    const s = new Storage({
      email,
      password,
      userAgent: "CenterManagement/1.0",
      keepalive: true
    }, (err) => {
      if (err) return reject(err);
      storage = s;
      resolve(s);
    });
  });
}

export async function uploadToMega(fileName: string, buffer: Buffer): Promise<string> {
  const s = await getMegaStorage();
  
  return new Promise<string>((resolve, reject) => {
    console.log(`Mega: Starting upload of ${fileName} (${buffer.length} bytes)`);
    
    const timeout = setTimeout(() => {
      reject(new Error("Mega upload timed out after 30 seconds"));
    }, 30000);

    try {
      // Direct data upload instead of stream for better reliability in server actions
      (s as any).upload({
        name: fileName,
        size: buffer.length
      }, buffer, (err: any, file: any) => {
        clearTimeout(timeout);
        if (err) return reject(err);
        
        console.log(`Mega: Upload complete for ${fileName}, generating link...`);
        file.link((err: any, link: string) => {
          if (err) return reject(err);
          console.log(`Mega: Link generated: ${link}`);
          resolve(link);
        });
      });
    } catch (error) {
      clearTimeout(timeout);
      reject(error);
    }
  });
}




