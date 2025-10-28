import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import InputField from '../common/InputField';
import Button from '../common/Button';

function ProfileInfo() {
  const { user } = useContext(AuthContext);

  if (!user) return null;

  return (
    <form>
      <h4>Thông tin cá nhân</h4>
      <InputField 
        label="Họ và tên" 
        id="profileName" 
        defaultValue={user.name} 
      />
      <InputField 
        label="Email" 
        id="profileEmail" 
        defaultValue={user.email} 
        disabled 
      />
      <InputField 
        label="Mật khẩu mới (bỏ trống nếu không đổi)" 
        id="newPassword" 
        type="password"
        placeholder="Nhập mật khẩu mới"
      />
      <Button type="submit" className="btn btn-primary mt-3">
        Cập nhật thông tin
      </Button>
    </form>
  );
}

export default ProfileInfo;
