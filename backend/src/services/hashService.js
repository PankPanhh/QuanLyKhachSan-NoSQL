import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export const hashPassword = async (plain) => bcrypt.hash(plain, SALT_ROUNDS);
export const comparePassword = async (plain, hash) => bcrypt.compare(plain, hash);
export const hashOtp = async (otp) => bcrypt.hash(otp, SALT_ROUNDS);
export const compareOtp = async (otp, hash) => bcrypt.compare(otp, hash);