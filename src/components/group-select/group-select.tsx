import { useState, memo, useMemo } from "react";

import { PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Form,
  Row,
  Col,
  Input,
  Select,
  Divider,
  SelectProps,
} from "antd";

import { ILabelValue } from "@src/types";

import styles from "./group-select.module.scss";

export interface IGroupSelectProps extends SelectProps {
  groups: string[];
}

export const GroupSelect = memo(({ groups, ...rest }: IGroupSelectProps) => {
  const [newGroups, setNewGroups] = useState<ILabelValue[]>([]);
  const [form] = Form.useForm<{ name?: string }>();

  const options = useMemo(
    () => groups.map((v) => ({ label: v, value: v })).concat(newGroups),
    [newGroups, groups],
  );

  const handleAdd = () => {
    let value = form.getFieldValue("name");
    value = value ? value.toLowerCase() : "";
    const found = options.find((v) => v.value === value);
    if (value && !found) {
      setNewGroups(newGroups.concat([{ value, label: value }]));
    }
  };

  const dropdownRender: SelectProps["dropdownRender"] = (menu) => {
    return (
      <div>
        {menu}
        <Divider className={styles.groupSelectDivider} />
        <Form form={form} autoComplete="off">
          <Row>
            <Col sm={{ offset: 1, span: 10 }}>
              <Form.Item name={"name"}>
                <Input />
              </Form.Item>
            </Col>
            <Col sm={{ offset: 1, span: 6 }}>
              <Button type="primary" htmlType="submit" onClick={handleAdd}>
                <PlusOutlined /> Add item
              </Button>
            </Col>
          </Row>
        </Form>
      </div>
    );
  };

  return (
    <Select
      allowClear
      defaultActiveFirstOption={false}
      options={options}
      {...rest}
      dropdownRender={dropdownRender}
    />
  );
});
