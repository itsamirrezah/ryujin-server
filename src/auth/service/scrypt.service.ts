import { Injectable } from "@nestjs/common";
import { randomBytes, scrypt as _scrypt } from "crypto";
import { promisify } from "util";
import { HashingService } from "./hashing.service";

const scrypt = promisify(_scrypt)

@Injectable()
export class ScryptService implements HashingService {
  async hash(data: string | Buffer): Promise<string> {
    const salt = randomBytes(32).toString("hex");
    const hash = (await scrypt(data, salt, 32)) as Buffer
    return `${salt}.${hash.toString("hex")}`
  }
  compare(data: string | Buffer, hash: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
}
