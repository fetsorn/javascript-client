import { DataView } from "./DataView";
import {
  Format,
  isFloat32,
  isFloat64,
  isFixedInt,
  isNegativeFixedInt,
  isFixedMap,
  isFixedArray,
  isFixedString
} from "./Format";
import { Nullable } from "./Nullable";
import { Read } from "./Read";
import { E_INVALIDLENGTH } from "util/error";

export class ReadDecoder extends Read {
  private view: DataView;

  constructor(ua: ArrayBuffer) {
    super();
    this.view = new DataView(ua, 0, ua.byteLength);
  }

  readBool(): bool {
    const value = this.view.getUint8();
    if (value == Format.TRUE) {
      return true;
    } else if (value == Format.FALSE) {
      return false;
    }
    throw new Error("bad value for bool");
  }

  readInt8(): i8 {
    const value = this.readInt64();
    if (value <= <i64>i8.MAX_VALUE || value >= <i64>i8.MIN_VALUE) {
      return <i8>value;
    }
    throw new Error(
      "interger overflow: value = " + value.toString() + "; bits = 8"
    );
  }

  readInt16(): i16 {
    const value = this.readInt64();
    if (value <= <i64>i16.MAX_VALUE || value >= <i64>i16.MIN_VALUE) {
      return <i16>value;
    }
    throw new Error(
      "interger overflow: value = " + value.toString() + "; bits = 16"
    );
  }

  readInt32(): i32 {
    const value = this.readInt64();
    if (value <= <i64>i32.MAX_VALUE || value >= <i64>i32.MIN_VALUE) {
      return <i32>value;
    }
    throw new Error(
      "interger overflow: value = " + value.toString() + "; bits = 32"
    );
  }

  readInt64(): i64 {
    const prefix = this.view.getUint8();

    if (isFixedInt(prefix)) {
      return <i64>prefix;
    }
    if (isNegativeFixedInt(prefix)) {
      return <i64>(<i8>prefix);
    }
    switch (prefix) {
      case Format.INT8:
        return <i64>this.view.getInt8();
      case Format.INT16:
        return <i64>this.view.getInt16();
      case Format.INT32:
        return <i64>this.view.getInt32();
      case Format.INT64:
        return this.view.getInt64();
      default:
        throw new Error("bad prefix for int");
    }
  }

  readUInt8(): u8 {
    const value = this.readUInt64();
    if (value <= <u64>u8.MAX_VALUE || value >= <u64>u8.MIN_VALUE) {
      return <u8>value;
    }
    throw new Error(
      "unsigned interger overflow: value = " + value.toString() + "; bits = 8"
    );
  }

  readUInt16(): u16 {
    const value = this.readUInt64();
    if (value <= <u64>u16.MAX_VALUE || value >= <u64>u16.MIN_VALUE) {
      return <u16>value;
    }
    throw new Error(
      "unsigned interger overflow: value = " + value.toString() + "; bits = 16"
    );
  }

  readUInt32(): u32 {
    const value = this.readUInt64();
    if (value <= <u64>u32.MAX_VALUE || value >= <u64>u32.MIN_VALUE) {
      return <u32>value;
    }
    throw new Error(
      "unsigned interger overflow: value = " + value.toString() + "; bits = 32"
    );
  }

  readUInt64(): u64 {
    const prefix = this.view.getUint8();

    if (isFixedInt(prefix)) {
      return <u64>prefix;
    } else if (isNegativeFixedInt(prefix)) {
      throw new Error("bad prefix");
    }

    switch (prefix) {
      case Format.UINT8:
        return <u64>this.view.getUint8();
      case Format.UINT16:
        return <u64>this.view.getUint16();
      case Format.UINT32:
        return <u64>this.view.getUint32();
      case Format.UINT64:
        return this.view.getUint64();
      default:
        throw new Error("bad prefix for unsigned int");
    }
  }

  readFloat32(): f32 {
    const prefix = this.view.getUint8();
    if (isFloat32(prefix)) {
      return <f32>this.view.getFloat32();
    }
    throw new Error("bad prefix");
  }

  readFloat64(): f64 {
    const prefix = this.view.getUint8();
    if (isFloat64(prefix)) {
      return <f64>this.view.getFloat64();
    }
    throw new Error("bad prefix");
  }

  readStringLength(): u32 {
    const leadByte = this.view.getUint8();
    if (isFixedString(leadByte)) {
      return leadByte & 0x1f;
    }
    if (isFixedArray(leadByte)) {
      return <u32>(leadByte & Format.FOUR_LEAST_SIG_BITS_IN_BYTE);
    }
    switch (leadByte) {
      case Format.STR8:
        return <u32>this.view.getUint8();
      case Format.STR16:
        return <u32>this.view.getUint16();
      case Format.STR32:
        return this.view.getUint32();
    }

    throw new RangeError(E_INVALIDLENGTH + leadByte.toString());
  }

  readString(): string {
    const strLen = this.readStringLength();
    const stringBytes = this.view.getBytes(strLen);
    return String.UTF8.decode(stringBytes);
  }

  readBytesLength(): u32 {
    if (this.isNextNil()) {
      return 0;
    }
    const leadByte = this.view.getUint8();
    if (isFixedArray(leadByte)) {
      return <u32>(leadByte & Format.FOUR_LEAST_SIG_BITS_IN_BYTE);
    }
    switch (leadByte) {
      case Format.BIN8:
        return <u32>this.view.getUint8();
      case Format.BIN16:
        return <u32>this.view.getUint16();
      case Format.BIN32:
        return this.view.getUint32();
    }
    throw new RangeError(E_INVALIDLENGTH);
  }

  readBytes(): ArrayBuffer {
    const arrLength = this.readBytesLength();
    const arrBytes = this.view.getBytes(arrLength);
    return arrBytes;
  }

  readArrayLength(): u32 {
    const leadByte = this.view.getUint8();
    if (isFixedArray(leadByte)) {
      return <u32>(leadByte & Format.FOUR_LEAST_SIG_BITS_IN_BYTE);
    } else if (leadByte == Format.ARRAY16) {
      return <u32>this.view.getUint16();
    } else if (leadByte == Format.ARRAY32) {
      return this.view.getUint32();
    } else if (leadByte == Format.NIL) {
      return 0;
    }
    throw new RangeError(E_INVALIDLENGTH + leadByte.toString());
  }

  readArray<T>(fn: (reader: Read) => T): Array<T> {
    const size = this.readArrayLength();
    let a = new Array<T>();
    for (let i: u32 = 0; i < size; i++) {
      const item = fn(this);
      a.push(item);
    }
    return a;
  }

  readMapLength(): u32 {
    const leadByte = this.view.getUint8();
    if (isFixedMap(leadByte)) {
      return <u32>(leadByte & Format.FOUR_LEAST_SIG_BITS_IN_BYTE);
    } else if (leadByte == Format.MAP16) {
      return <u32>this.view.getUint16();
    } else if (leadByte == Format.MAP32) {
      return this.view.getUint32();
    }
    throw new RangeError(E_INVALIDLENGTH);
  }

  readMap<K, V>(
    keyFn: (reader: Read) => K,
    valueFn: (reader: Read) => V
  ): Map<K, V> {
    const size = this.readMapLength();
    let m = new Map<K, V>();
    for (let i: u32 = 0; i < size; i++) {
      const key = keyFn(this);
      const value = valueFn(this);
      m.set(key, value);
    }
    return m;
  }

  readNullableBool(): Nullable<bool> {
    if (this.isNextNil()) {
      return Nullable.fromNull<bool>();
    }
    return Nullable.fromValue<bool>(this.readBool());
  }

  readNullableInt8(): Nullable<i8> {
    if (this.isNextNil()) {
      return Nullable.fromNull<i8>();
    }
    return Nullable.fromValue<i8>(this.readInt8());
  }

  readNullableInt16(): Nullable<i16> {
    if (this.isNextNil()) {
      return Nullable.fromNull<i16>();
    }
    return Nullable.fromValue<i16>(this.readInt16());
  }

  readNullableInt32(): Nullable<i32> {
    if (this.isNextNil()) {
      return Nullable.fromNull<i32>();
    }
    return Nullable.fromValue<i32>(this.readInt32());
  }

  readNullableInt64(): Nullable<i64> {
    if (this.isNextNil()) {
      return Nullable.fromNull<i64>();
    }
    return Nullable.fromValue<i64>(this.readInt64());
  }

  readNullableUInt8(): Nullable<u8> {
    if (this.isNextNil()) {
      return Nullable.fromNull<u8>();
    }
    return Nullable.fromValue<u8>(this.readUInt8());
  }

  readNullableUInt16(): Nullable<u16> {
    if (this.isNextNil()) {
      return Nullable.fromNull<u16>();
    }
    return Nullable.fromValue<u16>(this.readUInt16());
  }

  readNullableUInt32(): Nullable<u32> {
    if (this.isNextNil()) {
      return Nullable.fromNull<u32>();
    }
    return Nullable.fromValue<u32>(this.readUInt32());
  }

  readNullableUInt64(): Nullable<u64> {
    if (this.isNextNil()) {
      return Nullable.fromNull<u64>();
    }
    return Nullable.fromValue<u64>(this.readUInt64());
  }

  readNullableFloat32(): Nullable<f32> {
    if (this.isNextNil()) {
      return Nullable.fromNull<f32>();
    }
    return Nullable.fromValue<f32>(this.readFloat32());
  }

  readNullableFloat64(): Nullable<f64> {
    if (this.isNextNil()) {
      return Nullable.fromNull<f64>();
    }
    return Nullable.fromValue<f64>(this.readFloat64());
  }

  readNullableString(): string | null {
    if (this.isNextNil()) {
      return null;
    }
    return this.readString();
  }

  readNullableBytes(): ArrayBuffer | null {
    if (this.isNextNil()) {
      return null;
    }
    return this.readBytes();
  }

  readNullableArray<T>(fn: (decoder: Read) => T): Array<T> | null {
    if (this.isNextNil()) {
      return null;
    }
    return this.readArray(fn);
  }

  readNullableMap<K, V>(
    keyFn: (decoder: Read) => K,
    valueFn: (decoder: Read) => V
  ): Map<K, V> | null {
    if (this.isNextNil()) {
      return null;
    }
    return this.readMap(keyFn, valueFn);
  }

  private isNextNil(): bool {
    if (this.view.peekUint8() == Format.NIL) {
      this.view.discard(1);
      return true;
    }
    return false;
  }

  private skip(): void {
    // getSize handles discarding 'msgpack header' info
    let numberOfObjectsToDiscard = this.getSize();

    while (numberOfObjectsToDiscard > 0) {
      this.getSize(); // discard next object
      numberOfObjectsToDiscard--;
    }
  }

  private getSize(): i32 {
    const leadByte = this.view.getUint8(); // will discard one
    let objectsToDiscard = <i32>0;
    // Handled for fixed values
    if (isNegativeFixedInt(leadByte)) {
      // noop, will just discard the leadbyte
    } else if (isFixedInt(leadByte)) {
      // noop, will just discard the leadbyte
    } else if (isFixedString(leadByte)) {
      let strLength = leadByte & 0x1f;
      this.view.discard(strLength);
    } else if (isFixedArray(leadByte)) {
      // TODO handle overflow
      objectsToDiscard = <i32>(leadByte & Format.FOUR_LEAST_SIG_BITS_IN_BYTE);
    } else if (isFixedMap(leadByte)) {
      // TODO handle overflow
      objectsToDiscard =
        2 * <i32>(leadByte & Format.FOUR_LEAST_SIG_BITS_IN_BYTE);
    } else {
      switch (leadByte) {
        case Format.NIL:
          break;
        case Format.TRUE:
          break;
        case Format.FALSE:
          break;
        case Format.BIN8:
          this.view.discard(<i32>this.view.getUint8());
          break;
        case Format.BIN16:
          this.view.discard(<i32>this.view.getUint16());
          break;
        case Format.BIN32:
          this.view.discard(<i32>this.view.getUint32());
          break;
        case Format.FLOAT32:
          this.view.discard(4);
          break;
        case Format.FLOAT64:
          this.view.discard(8);
          break;
        case Format.UINT8:
          this.view.discard(1);
          break;
        case Format.UINT16:
          this.view.discard(2);
          break;
        case Format.UINT32:
          this.view.discard(4);
          break;
        case Format.UINT64:
          this.view.discard(8);
          break;
        case Format.INT8:
          this.view.discard(1);
          break;
        case Format.INT16:
          this.view.discard(2);
          break;
        case Format.INT32:
          this.view.discard(4);
          break;
        case Format.INT64:
          this.view.discard(8);
          break;
        case Format.FIXEXT1:
          this.view.discard(2);
          break;
        case Format.FIXEXT2:
          this.view.discard(3);
          break;
        case Format.FIXEXT4:
          this.view.discard(5);
          break;
        case Format.FIXEXT8:
          this.view.discard(9);
          break;
        case Format.FIXEXT16:
          this.view.discard(17);
          break;
        case Format.STR8:
          this.view.discard(this.view.getUint8());
          break;
        case Format.STR16:
          this.view.discard(this.view.getUint16());
          break;
        case Format.STR32:
          // TODO overflow, need to modify discard and underlying array buffer
          this.view.discard(this.view.getUint32());
          break;
        case Format.ARRAY16:
          //TODO OVERFLOW
          objectsToDiscard = <i32>this.view.getUint16();
          break;
        case Format.ARRAY32:
          //TODO OVERFLOW
          objectsToDiscard = <i32>this.view.getUint32();
          break;
        case Format.MAP16:
          //TODO OVERFLOW
          objectsToDiscard = 2 * <i32>this.view.getUint16();
          break;
        case Format.MAP32:
          //TODO OVERFLOW
          objectsToDiscard = 2 * <i32>this.view.getUint32();
          break;
        default:
          throw new TypeError(
            "invalid prefix, bad encoding for val: " + leadByte.toString()
          );
      }
    }

    return objectsToDiscard;
  }
}
