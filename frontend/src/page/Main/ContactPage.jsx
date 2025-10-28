import React from 'react';
import InputField from '../../components/common/InputField';
import Button from '../../components/common/Button';

function ContactPage() {
  return (
    <div className="container padding-large">
      <h1 className="display-3 fw-normal text-center mb-5">Liên hệ với chúng tôi</h1>
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <form>
            <InputField
              label="Họ và tên"
              type="text"
              id="name"
              placeholder="Nhập tên của bạn"
            />
            <InputField
              label="Email"
              type="email"
              id="email"
              placeholder="Nhập email của bạn"
            />
            <div className="mb-3">
              <label htmlFor="message" className="form-label">Nội dung tin nhắn</label>
              <textarea 
                className="form-control" 
                id="message" 
                rows="5"
                placeholder="Nội dung bạn muốn gửi..."
              ></textarea>
            </div>
            <Button type="submit" className="btn btn-primary btn-lg">
              Gửi tin nhắn
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ContactPage;
