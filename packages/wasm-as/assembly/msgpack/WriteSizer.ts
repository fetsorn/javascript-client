import { Write } from "./Write";
import { Nullable } from "./Nullable";

export class WriteSizer extends Write {
  length: i32;

  constructor() { super() }

  writeNil(): void {
    this.length++;
  }

  writeBool(value: bool): void {
    this.length++;
  }

  writeInt8(value: i8): void {
    this.writeInt64(<i64>value);
  }
  writeInt16(value: i16): void {
    this.writeInt64(<i64>value);
  }
  writeInt32(value: i32): void {
    this.writeInt64(<i64>value);
  }

  writeInt64(value: i64): void {
    if (value >= -(1 << 5) && value < 1 << 7) {
      this.length++;
    } else if (value < 1 << 7 && value >= -(1 << 7)) {
      this.length += 2;
    } else if (value < 1 << 15 && value >= -(1 << 15)) {
      this.length += 3;
    } else if (value < 1 << 31 && value >= -(1 << 31)) {
      this.length += 5;
    } else {
      this.length += 9;
    }
  }

  writeUInt8(value: u8): void {
    this.writeUInt64(<u64>value);
  }

  writeUInt16(value: u16): void {
    this.writeUInt64(<u64>value);
  }

  writeUInt32(value: u32): void {
    this.writeUInt64(<u64>value);
  }

  writeUInt64(value: u64): void {
    if (value < 1 << 7) {
      this.length++;
    } else if (value < 1 << 8) {
      this.length += 2;
    } else if (value < 1 << 16) {
      this.length += 3;
    } else if (value < 1 << 32) {
      this.length += 5;
    } else {
      this.length += 9;
    }
  }

  writeFloat32(value: f32): void {
    this.length += 5;
  }

  writeFloat64(value: f64): void {
    this.length += 9;
  }

  writeStringLength(length: u32): void {
    if (length < 32) {
      this.length++;
    } else if (length <= <u32>u8.MAX_VALUE) {
      this.length += 2;
    } else if (length <= <u32>u16.MAX_VALUE) {
      this.length += 3;
    } else {
      this.length += 5;
    }
  }

  writeString(value: string): void {
    const buf = String.UTF8.encode(value);
    this.writeStringLength(buf.byteLength);
    this.length += buf.byteLength;
  }

  writeBytesLength(length: u32): void {
    if (length <= <u32>u8.MAX_VALUE) {
      this.length += 2;
    } else if (length <= <u32>u16.MAX_VALUE) {
      this.length += 3;
    } else {
      this.length += 5;
    }
  }

  writeBytes(value: ArrayBuffer): void {
    if (value.byteLength == 0) {
      this.length++; //nil byte
      return;
    }
    this.writeBytesLength(value.byteLength);
    this.length += value.byteLength + 1;
  }

  writeArrayLength(length: u32): void {
    if (length < 16) {
      this.length++;
    } else if (length <= <u32>u16.MAX_VALUE) {
      this.length += 3;
    } else {
      this.length += 5;
    }
  }

  writeArray<T>(a: Array<T>, fn: (sizer: WriteSizer, item: T) => void): void {
    this.writeArrayLength(a.length);
    for (let i: i32 = 0; i < a.length; i++) {
      fn(this, a[i]);
    }
  }

  writeMapLength(length: u32): void {
    if (length < 16) {
      this.length++;
    } else if (length <= <u32>u16.MAX_VALUE) {
      this.length += 3;
    } else {
      this.length += 5;
    }
  }

  writeMap<K, V>(
    m: Map<K, V>,
    keyFn: (sizer: WriteSizer, key: K) => void,
    valueFn: (sizer: WriteSizer, value: V) => void
  ): void {
    this.writeMapLength(m.size);
    const keys = m.keys();
    for (let i: i32 = 0; i < keys.length; i++) {
      const key = keys[i];
      const value = m.get(key);
      keyFn(this, key);
      valueFn(this, value);
    }
  }

  writeNullableBool(value: Nullable<bool>): void {
    if (value.isNull) {
      this.writeNil();
      return;
    }

    this.writeBool(value.value);
  }

  writeNullableInt8(value: Nullable<i8>): void {
    if (value.isNull) {
      this.writeNil();
      return;
    }

    this.writeInt8(value.value);
  }

  writeNullableInt16(value: Nullable<i16>): void {
    if (value.isNull) {
      this.writeNil();
      return;
    }

    this.writeInt16(value.value);
  }

  writeNullableInt32(value: Nullable<i32>): void {
    if (value.isNull) {
      this.writeNil();
      return;
    }

    this.writeInt32(value.value);
  }

  writeNullableInt64(value: Nullable<i64>): void {
    if (value.isNull) {
      this.writeNil();
      return;
    }

    this.writeInt64(value.value);
  }

  writeNullableUInt8(value: Nullable<u8>): void {
    if (value.isNull) {
      this.writeNil();
      return;
    }

    this.writeUInt8(value.value);
  }

  writeNullableUInt16(value: Nullable<u16>): void {
    if (value.isNull) {
      this.writeNil();
      return;
    }

    this.writeUInt16(value.value);
  }

  writeNullableUInt32(value: Nullable<u32>): void {
    if (value.isNull) {
      this.writeNil();
      return;
    }

    this.writeUInt32(value.value);
  }

  writeNullableUInt64(value: Nullable<u64>): void {
    if (value.isNull) {
      this.writeNil();
      return;
    }

    this.writeUInt64(value.value);
  }

  writeNullableFloat32(value: Nullable<f32>): void {
    if (value.isNull) {
      this.writeNil();
      return;
    }

    this.writeFloat32(value.value);
  }

  writeNullableFloat64(value: Nullable<f64>): void {
    if (value.isNull) {
      this.writeNil();
      return;
    }

    this.writeFloat64(value.value);
  }

  writeNullableString(value: string | null): void {
    if (value === null) {
      this.writeNil();
      return;
    }

    this.writeString(value);
  }

  writeNullableBytes(value: ArrayBuffer | null): void {
    if (value === null) {
      this.writeNil();
      return;
    }

    this.writeBytes(value);
  }


  writeNullableArray<T>(
    a: Array<T> | null,
    fn: (sizer: Sizer, item: T) => void
  ): void {
    if (a === null) {
      this.writeNil();
      return;
    }
    this.writeArray(a, fn);
  }

  writeNullableMap<K, V>(
    m: Map<K, V> | null,
    keyFn: (sizer: WriteSizer, key: K) => void,
    valueFn: (sizer: WriteSizer, value: V) => void
  ): void {
    if (m === null) {
      this.writeNil();
      return;
    }
    this.writeMap(m, keyFn, valueFn);
  }
}
