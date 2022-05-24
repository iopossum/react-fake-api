import React from 'react';
import ReactDOM from 'react-dom';
import { RFA } from '../../src';
import { hot } from 'react-hot-loader/root';
import { Select, Button, Form, Space, Input, notification, Spin, Alert } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';

const routes = [
  { path: '/test', delay: 1000, response: () => {
    return 1;
  } }
]

const isPassed = (res) => res && res.headers?.get('x-powered-by');

const NotificationContent = ({ spinning, type = 'info', message = 'Loading...', description }) => {
  return (
    <Spin spinning={spinning}>
      <Alert
        type={type}
        message={message}
        description={description}
      />
    </Spin>
  )
}

const App = hot(() => {
  const [form] = Form.useForm();
  const _onSend = ({ name }) => {
    const { routes } = form.getFieldsValue();
    const _route = routes[name];
    if (_route.path) {
      const _method = _route.method || 'get';
      const _notificationHeader = `${_method.toUpperCase()}: ${_route.path}`;
      notification.open({
        key: name.toString(),
        message: _notificationHeader,
        description: <NotificationContent />,
        duration: 0
      });
      fetch(_route.path,
        {
          method: _method.toUpperCase()
        })
        .then((res) => Promise.resolve(res))
        .catch((res) => Promise.resolve(res))
        .then(res => {
          const _isPassed = isPassed(res);
          console.log(res)
          notification.open({
            key: name.toString(),
            message: `${_notificationHeader} - ${_isPassed ? 'PASSED' : 'CATCHED'}`,
            description: (
              <NotificationContent
                spinning={false}
                type={res.ok ? 'success' : 'error'}
                message={`STATUS: ${res.status}`}
                description={!_isPassed ? JSON.stringify(res._bodyText || '', null, 2) : '' }
              />
            ),
            duration: 0
          });
        })
    }
  }
  return (
    <>
      <RFA routes={routes}>
        <Form
          form={form}
          autoComplete="off"
          layout={'vertical'}
          initialValues={{ routes }}
        >
          <Form.List name="routes">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, 'method']}
                      initialValue={'get'}
                    >
                      <Select
                        style={{ width: 70 }}
                        allowClear={false}
                        options={['get', 'post', 'put', 'patch', 'delete'].map(v => ({ label: v.toUpperCase(), value: v }))}
                      />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'path']}
                      rules={[{ required: true, message: 'Missing path' }]}
                    >
                      <Input placeholder="path" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'body']}
                    >
                      <Input placeholder="body" />
                    </Form.Item>
                    <Button onClick={() => _onSend({ key, name, ...restField })}>
                      Send
                    </Button>
                    <MinusCircleOutlined onClick={() => remove(name)} />
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={add} block icon={<PlusOutlined />}>
                    Add path
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      </RFA>
    </>
  )
});

ReactDOM.render(<App />, document.querySelector('#root'));
