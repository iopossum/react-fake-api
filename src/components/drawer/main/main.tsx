import {
  useMemo,
  useState,
  useLayoutEffect,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useCallback,
  MouseEvent,
  memo,
} from "react";

import {
  DownSquareTwoTone,
  BulbTwoTone,
  EditTwoTone,
  SettingTwoTone,
  WarningTwoTone,
  InfoCircleTwoTone,
  DownSquareOutlined,
} from "@ant-design/icons";
import {
  Dropdown,
  MenuProps,
  Drawer,
  List,
  ListProps,
  Checkbox,
  Tag,
  Collapse,
  Tooltip,
  Space,
  Badge,
  notification,
} from "antd";
import { groupBy } from "lodash-es";

import { CleanConfirm } from "@src/components/confirm";

import {
  IRoute,
  IStorageCfg,
  ROUTE_TYPES,
  IMirageExtendedRequest,
  TMethod,
} from "@src/types";

import { getLSItem, setLSItem, deleteLSItem } from "@src/utils/ls";
import { makeServer, IFakeServerProps } from "@src/utils/server";

import { GroupEditDrawer, IGroupEditDrawerHandle } from "../group-edit";
import { RouteEditDrawer, IRouteEditDrawerHandle } from "../route-edit";

import { DEFAULT_CONFIG, GROUP_SETTING_MENU } from "./consts";
import { TMenuItem, IRouteExtended } from "./types";
import {
  getPathKey,
  getMethodColor,
  waitResponse,
  convertRoutes,
} from "./utils";

import styles from "./main.module.scss";

export interface IMainDrawerProps {
  serverProps?: Omit<IFakeServerProps, "passthrough" | "routes">;
  storageName?: string;
  routes?: IRoute[];
  showNotification?: boolean;
  saveHandled?: boolean;
}

export interface IMainDrawerHandle {
  open: () => void;
}

export const MainDrawer = memo(
  forwardRef<IMainDrawerHandle, IMainDrawerProps>(
    (
      {
        saveHandled = true,
        serverProps,
        storageName = "rfa",
        routes = [],
        showNotification,
      },
      ref,
    ) => {
      const routeEditDrawerRef = useRef<IRouteEditDrawerHandle>(null);
      const groupEditDrawerRef = useRef<IGroupEditDrawerHandle>(null);
      const serverRef = useRef<ReturnType<typeof makeServer>>();

      const [items, setItems] = useState<IRouteExtended[]>(() =>
        convertRoutes(routes),
      );
      const [visible, setVisible] = useState(false);
      const [autoHandle, setAutoHandle] = useState(DEFAULT_CONFIG.autoHandle);

      const { defaultHost } = serverProps || {};

      const settingsMenuItems: TMenuItem[] = useMemo(() => {
        return [
          { label: "Add", key: "add" },
          { label: "Clear cache", key: "cache" },
          {
            label: autoHandle ? "Disable auto handle" : "Enable auto handle",
            key: "autoHandle",
          },
          { label: "Select all", key: "selectAll" },
          { label: "Unselect all", key: "unselectAll" },
          { label: "Export", key: "export" },
        ];
      }, [autoHandle]);

      const memoGroups = useMemo(() => {
        const grouped = groupBy(items, "group");
        const labels = Object.keys(grouped);
        return {
          labels,
          filteredLabels: labels.filter(
            (v) => ["handled", "undefined"].indexOf(v) === -1,
          ),
          groups: Object.entries(grouped).map(([label, routes]) => ({
            label,
            checked: routes.filter((v) => v.checked).length,
            total: routes.length,
          })),
        };
      }, [items]);

      const passthrough = useCallback<IFakeServerProps["passthrough"]>(
        (urls) => {
          const request = urls as IMirageExtendedRequest;
          const item: IRoute = {
            path: request.url
              .replace(/\?.+/g, "")
              .replace(defaultHost || window.location.host, ""),
            method: request.method.toLowerCase() as TMethod,
          };
          const filtered = items.filter(
            (v) => v.path === item.path && v.method === item.method,
          );
          if (!filtered.length) {
            if (autoHandle) {
              waitResponse(request)
                .then((res) => {
                  let json;
                  try {
                    json = JSON.parse(res);
                  } catch (e) {
                    json = res;
                  }
                  if (json) {
                    item.custom = json;
                    item.group = "handled";
                    item.type = "handled";
                    item.color = getMethodColor(item.method);
                    item.status = request.status;
                    setItems((prev) => [
                      ...prev,
                      { ...item, index: prev.length },
                    ]);
                  }
                })
                .catch(() => {
                  /* eslint-disable-next-line no-console */
                  console.warn(`${request.url} - Timeout`);
                });
            }
            return true;
          }
          const checked = filtered[0].checked;
          if (checked && showNotification) {
            notification.info({
              message: undefined,
              key: filtered[0].path,
              description: `${filtered[0].method.toUpperCase()}: ${filtered[0].path} catched`,
            });
          }
          return !checked;
        },
        [autoHandle, defaultHost, showNotification, items],
      );

      const handleHideDrawer = () => {
        setVisible(false);
      };

      const handleChangeActive = (item: IRouteExtended) => {
        items[item.index].checked = !items[item.index].checked;
        setItems([...items]);
      };

      const handleCleanDelay = (item: IRouteExtended) => {
        delete items[item.index].delay;
        setItems([...items]);
      };

      const handleCleanError = (item: IRouteExtended) => {
        items[item.index].error = false;
        setItems([...items]);
      };

      const handleCleanCustom = (item: IRouteExtended) => {
        delete items[item.index].custom;
        setItems([...items]);
      };

      const handleAutoHandleChange = () => {
        setAutoHandle(!autoHandle);
      };

      const handleExport = async () => {
        const blob = new Blob([JSON.stringify(items, null, 2)], {
          type: "application/json",
        });
        const href = await URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = href;
        link.download = `${storageName}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };

      const handleAdd = async () => {
        const item: Partial<IRoute> = {
          type: "manual",
          method: "get",
        };
        try {
          const data =
            (await routeEditDrawerRef.current!.open(item)) || ({} as IRoute);
          data.type = item.type;

          data.color = getMethodColor(data.method);
          setItems([...items, { ...data, index: items.length }]);
        } catch (e) {}
      };

      const handleEdit = async (item: IRouteExtended) => {
        try {
          const data = await routeEditDrawerRef.current!.open(
            items[item.index],
          );
          Object.assign(items[item.index], data);
          setItems([...items]);
        } catch (e) {}
      };

      const handleDelete = (item: IRouteExtended) => {
        items.splice(item.index, 1);
        setItems([...items]);
      };

      const handleGroupEditClick = (e: MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
      };

      const handleSettingsMenuItemClick: MenuProps["onClick"] = (e) => {
        switch (e.key) {
          case "add":
            handleAdd();
            break;
          case "cache":
            deleteLSItem(storageName);
            break;
          case "autoHandle":
            setTimeout(handleAutoHandleChange, 500);
            break;
          case "selectAll":
            setItems((prev) => prev.map((v) => ({ ...v, checked: true })));
            break;
          case "unselectAll":
            setItems((prev) => prev.map((v) => ({ ...v, checked: false })));
            break;
          case "export":
            handleExport();
            break;
        }
      };

      const handleGroupSettingsMenuItemClick = async (
        group: string,
        e: Parameters<NonNullable<MenuProps["onClick"]>>[number],
      ) => {
        switch (e.key) {
          case "edit":
            try {
              const data = await groupEditDrawerRef.current!.open(
                group === "undefined" ? "" : group,
              );
              setItems((prev) =>
                prev.map((v) => ({
                  ...v,
                  group:
                    (v.group || "undefined") === group ? data.group : v.group,
                })),
              );
            } catch (e) {}
            break;
          case "selectAll":
            setItems((prev) =>
              prev.map((v) => ({
                ...v,
                checked: (v.group || "undefined") === group ? true : v.checked,
              })),
            );
            break;
          case "unselectAll":
            setItems((prev) =>
              prev.map((v) => ({
                ...v,
                checked: (v.group || "undefined") === group ? false : v.checked,
              })),
            );
            break;
        }
      };

      const renderItem: ListProps<IRouteExtended>["renderItem"] = (item) => {
        const actions = [];
        const handleClick: MenuProps["onClick"] = (e) => {
          switch (e.key) {
            case "edit":
              handleEdit(item);
              break;
            case "delete":
              handleDelete(item);
              break;
          }
        };
        const menuItems: TMenuItem[] = [{ label: "Edit", key: "edit" }];
        if (ROUTE_TYPES.indexOf(item.type!) > -1) {
          menuItems.push({ label: "Delete", key: "delete" });
        }
        if (item.delay) {
          actions.push(
            <CleanConfirm onConfirm={handleCleanDelay.bind(null, item)}>
              <Tooltip title={"Response delay"}>
                <span className={styles.delay}>{item.delay}ms</span>
              </Tooltip>
            </CleanConfirm>,
          );
        }
        if (item.error) {
          actions.push(
            <CleanConfirm onConfirm={handleCleanError.bind(null, item)}>
              <Tooltip title={"Response error"}>
                <WarningTwoTone twoToneColor="red" />
              </Tooltip>
            </CleanConfirm>,
          );
        }
        if (!!item.status && item.status !== 200) {
          actions.push(
            <Tooltip title={"Response status"}>
              {item.status >= 400 ? (
                <Tag color="error">{item.status}</Tag>
              ) : (
                <span className={styles.delay}>{item.status}</span>
              )}
            </Tooltip>,
          );
        }
        if (item.custom) {
          actions.push(
            <CleanConfirm
              onConfirm={handleCleanCustom.bind(null, item)}
              disabled={item.type === "handled"}
            >
              <Tooltip title={"Custom response"} placement="topRight">
                <InfoCircleTwoTone />
              </Tooltip>
            </CleanConfirm>,
          );
        }
        actions.push(
          <Dropdown
            menu={{
              items: menuItems,
              onClick: handleClick,
            }}
            trigger={["click"]}
          >
            <SettingTwoTone />
          </Dropdown>,
        );
        let badgeIcon = null;
        switch (item.type) {
          case "handled":
            badgeIcon = <BulbTwoTone className={styles.badge} />;
            break;
          case "manual":
            badgeIcon = <EditTwoTone className={styles.badge} />;
            break;
        }
        return (
          <List.Item actions={actions}>
            <Checkbox
              checked={item.checked}
              onChange={handleChangeActive.bind(null, item)}
            >
              <Badge count={badgeIcon} color={"blue"}>
                <Tag color={item.color || getMethodColor(item.method)}>
                  {item.method.toUpperCase()}
                </Tag>
              </Badge>{" "}
              {item.path}
            </Checkbox>
          </List.Item>
        );
      };

      useEffect(() => {
        serverRef.current?.shutdown();
        serverRef.current = makeServer({
          defaultHost,
          passthrough,
          routes: items,
          ...serverProps,
        });
        setLSItem(storageName, {
          autoHandle,
          routes: saveHandled
            ? items
            : items.filter((v) => v.group !== "handled"),
        });
      }, [
        autoHandle,
        defaultHost,
        saveHandled,
        storageName,
        items,
        serverProps,
        passthrough,
      ]);

      useLayoutEffect(() => {
        const settings = getLSItem<IStorageCfg>(storageName) || {
          ...DEFAULT_CONFIG,
        };
        setAutoHandle(!!settings.autoHandle);
        const storageRoutes = settings.routes || [];
        const storageRoutesObj = {} as Record<string, IRoute>;
        storageRoutes.forEach((v) => {
          const key = getPathKey(v);
          if (!storageRoutesObj[key]) {
            storageRoutesObj[key] = v;
          }
        });
        let isChanged = storageRoutes.length > 0;
        const inputRoutes = convertRoutes(routes);
        inputRoutes.forEach((v) => {
          const key = getPathKey(v);
          if (storageRoutesObj[key]) {
            Object.assign(v, storageRoutesObj[key]);
            delete storageRoutesObj[key];
            isChanged = true;
          }
        });
        const newItems = isChanged
          ? inputRoutes.concat(
              Object.values(storageRoutesObj)
                .filter((v) => !!v.type)
                .map((v, i) => ({ ...v, index: inputRoutes.length + i })),
            )
          : inputRoutes;
        if (isChanged) {
          setItems(newItems);
        }
      }, [routes, storageName]);

      useImperativeHandle(ref, () => ({
        open: () => {
          setVisible(true);
        },
      }));

      return (
        <Drawer
          title="API"
          width={Math.min(500, window.innerWidth)}
          placement="right"
          className={styles.drawer}
          onClose={handleHideDrawer}
          open={visible}
          extra={
            <Dropdown
              menu={{
                items: settingsMenuItems,
                onClick: handleSettingsMenuItemClick,
              }}
              trigger={["click"]}
            >
              <DownSquareTwoTone />
            </Dropdown>
          }
        >
          <Collapse
            defaultActiveKey={
              memoGroups.labels.length ? [memoGroups.labels[0]] : []
            }
            items={memoGroups.groups.map((group) => {
              return {
                key: group.label,
                label: `${group.label === "undefined" ? "No group" : group.label} (${group.checked}/${group.total})`,
                children: (
                  <List
                    itemLayout="horizontal"
                    dataSource={items.filter((v) =>
                      group.label === "undefined"
                        ? !v.group
                        : v.group === group.label,
                    )}
                    renderItem={renderItem}
                  />
                ),
                extra: (
                  <Space onClick={handleGroupEditClick}>
                    <Dropdown
                      menu={{
                        items: GROUP_SETTING_MENU,
                        onClick: handleGroupSettingsMenuItemClick.bind(
                          null,
                          group.label,
                        ),
                      }}
                      trigger={["click"]}
                    >
                      <DownSquareOutlined />
                    </Dropdown>
                  </Space>
                ),
              };
            })}
          />
          <RouteEditDrawer
            ref={routeEditDrawerRef}
            groups={memoGroups.filteredLabels}
          />
          <GroupEditDrawer
            ref={groupEditDrawerRef}
            groups={memoGroups.filteredLabels}
          />
        </Drawer>
      );
    },
  ),
);
