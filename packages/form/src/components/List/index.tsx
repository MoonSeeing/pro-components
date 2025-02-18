﻿import type { ReactNode } from 'react';
import React, { useContext, useMemo } from 'react';
import type { ButtonProps } from 'antd';
import omit from 'omit.js';
import { Button, Form, Space, Tooltip, ConfigProvider } from 'antd';
import type { FormListFieldData, FormListOperation, FormListProps } from 'antd/lib/form/FormList';
import type { LabelTooltipType } from 'antd/lib/form/FormItemLabel';
import type { NamePath } from 'antd/lib/form/interface';
import { DeleteOutlined, PlusOutlined, CopyOutlined } from '@ant-design/icons';

import './index.less';

const FormListContext = React.createContext<
  | (FormListFieldData & {
      listName: NamePath;
    })
  | Record<string, any>
>({});

type ChildrenFunction = (
  fields: FormListFieldData[],
  operation: FormListOperation,
  meta: {
    errors: React.ReactNode[];
  },
) => React.ReactNode;

export type ProFormListProps = Omit<FormListProps, 'children'> & {
  creatorButtonProps?:
    | false
    | (ButtonProps & {
        creatorButtonText?: ReactNode;
        position?: 'top' | 'bottom';
      });
  creatorRecord?: Record<string, any>;
  label?: ReactNode;
  tooltip?: LabelTooltipType;
  actionRender?: (
    field: FormListFieldData,
    action: FormListOperation,
    defaultActionDom: ReactNode,
  ) => ReactNode[];
  children: ReactNode | ChildrenFunction;
  /** 自定义Item，可以用来将 action 放到别的地方 */
  itemRender?: (
    doms: { listDom: ReactNode; action: ReactNode },
    listMeta: {
      fields: FormListFieldData[];
      operation: FormListOperation;
      meta: {
        errors: React.ReactNode[];
      };
    },
  ) => ReactNode;
};

const ProFormList: React.FC<ProFormListProps> = ({
  children,
  actionRender,
  creatorButtonProps,
  label,
  tooltip,
  creatorRecord,
  itemRender,
  ...rest
}) => {
  const context = useContext(ConfigProvider.ConfigContext);
  const listContext = useContext(FormListContext);
  const baseClassName = context.getPrefixCls('pro-form-list');
  // 处理 list 的嵌套
  const name = useMemo(() => {
    if (listContext.fieldKey === undefined) {
      return rest.name;
    }
    return [listContext.fieldKey, rest.name].flat(1);
  }, [listContext.fieldKey, rest.name]);

  return (
    <Form.Item label={label} tooltip={tooltip} shouldUpdate>
      {({ getFieldValue }) => {
        return (
          <div className={baseClassName}>
            <Form.List {...rest} name={name}>
              {(fields, action, meta) => {
                const creatorButton = creatorButtonProps !== false && (
                  <Form.Item>
                    <Button
                      className={`${baseClassName}-creator-button-${
                        creatorButtonProps?.position || 'bottom'
                      }`}
                      type="dashed"
                      block
                      icon={<PlusOutlined />}
                      {...omit(creatorButtonProps || {}, ['position', 'creatorButtonText'])}
                      onClick={() => {
                        let index;
                        if (creatorButtonProps?.position === 'top') index = 0;
                        action.add(creatorRecord, index);
                      }}
                    >
                      {creatorButtonProps?.creatorButtonText || '添加一行数据'}
                    </Button>
                  </Form.Item>
                );
                if (typeof children === 'function') {
                  return (children as ChildrenFunction)(fields, action, meta);
                }
                return (
                  <div
                    style={{
                      width: 'max-content',
                    }}
                  >
                    {creatorButtonProps !== false &&
                      creatorButtonProps?.position === 'top' &&
                      creatorButton}
                    {fields.map((field) => {
                      const defaultActionDom = (
                        <div className={`${baseClassName}-action`}>
                          <Tooltip title="复制此行">
                            <CopyOutlined
                              className={`${baseClassName}-action-icon`}
                              onClick={() => {
                                action.add(getFieldValue([rest.name, field.key].flat(1)));
                              }}
                            />
                          </Tooltip>
                          <Tooltip title="删除此行">
                            <DeleteOutlined
                              className={`${baseClassName}-action-icon`}
                              onClick={() => action.remove(field.name)}
                            />
                          </Tooltip>
                        </div>
                      );
                      const dom =
                        actionRender?.(field, action, defaultActionDom) || defaultActionDom;

                      const contentDom = itemRender?.(
                        {
                          listDom: <div className={`${baseClassName}-container`}>{children}</div>,
                          action: dom,
                        },
                        {
                          fields,
                          operation: action,
                          meta,
                        },
                      ) || (
                        <Space
                          style={{
                            display: 'flex',
                          }}
                          align="end"
                        >
                          <div className={`${baseClassName}-container`}>{children}</div>
                          {dom}
                        </Space>
                      );

                      return (
                        <FormListContext.Provider
                          key={field.name}
                          value={{
                            ...field,
                            listName: rest.name,
                          }}
                        >
                          {contentDom}
                        </FormListContext.Provider>
                      );
                    })}
                    {creatorButtonProps !== false &&
                      creatorButtonProps?.position !== 'top' &&
                      creatorButton}
                  </div>
                );
              }}
            </Form.List>
          </div>
        );
      }}
    </Form.Item>
  );
};

export { FormListContext };

export default ProFormList;
