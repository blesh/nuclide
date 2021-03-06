/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 *
 * @flow
 */

import {React} from 'react-for-atom';
import type {ThreadItem} from './types';
import type Bridge from './Bridge';
import type ThreadStore from './ThreadStore';
import type {ThreadColumn} from '../../nuclide-debugger-base/lib/types';
import {Icon} from '../../nuclide-ui/Icon';
import {Table} from '../../nuclide-ui/Table';
import UniversalDisposable from '../../commons-node/UniversalDisposable';

type DebuggerThreadsComponentProps = {
  bridge: Bridge,
  threadStore: ThreadStore,
  customThreadColumns: Array<ThreadColumn>,
};

type DebuggerThreadsComponentState = {
  threadList: Array<ThreadItem>,
  selectedThreadId: number,
};

const activeThreadIndicatorComponent = (props: {cellData: boolean}) => (
  <div className="nuclide-debugger-thread-list-item-current-indicator">
    {props.cellData
      ? <Icon icon="arrow-right" title="Selected Thread" />
      : null
    }
  </div>
);

export class DebuggerThreadsComponent extends React.Component {
  props: DebuggerThreadsComponentProps;
  state: DebuggerThreadsComponentState;
  _disposables: UniversalDisposable;

  constructor(props: DebuggerThreadsComponentProps) {
    super(props);
    (this: any)._handleSelectThread = this._handleSelectThread.bind(this);
    this._disposables = new UniversalDisposable();
    this.state = {
      threadList: props.threadStore.getThreadList(),
      selectedThreadId: props.threadStore.getSelectedThreadId(),
    };
  }

  componentDidMount(): void {
    const {threadStore} = this.props;
    this._disposables.add(
      threadStore.onChange(() => {
        this.setState({
          threadList: threadStore.getThreadList(),
          selectedThreadId: threadStore.getSelectedThreadId(),
        });
      }),
    );
  }

  componentWillUnmount(): void {
    this._disposables.dispose();
  }

  _handleSelectThread(data: ThreadItem): void {
    this.props.bridge.selectThread(data.id);
  }

  render(): ?React.Element<any> {
    const {
      threadList,
      selectedThreadId,
    } = this.state;
    const activeThreadCol = {
      component: activeThreadIndicatorComponent,
      title: '',
      key: 'isSelected',
      width: 0.05,
    };

    const defaultColumns = [
      activeThreadCol,
      {
        title: 'ID',
        key: 'id',
        width: 0.15,
      },
      {
        title: 'Address',
        key: 'address',
        width: 0.55,
      },
      {
        title: 'Stop Reason',
        key: 'stopReason',
        width: 0.25,
      },
    ];

    // Individual debuggers can override the displayed columns.
    const customColumns = this.props.customThreadColumns.length === 0 ? [] :
      [activeThreadCol].concat(this.props.customThreadColumns.map(col => ({
        title: col.title,
        key: col.key,
      })));

    const columns = customColumns.length > 0 ? customColumns : defaultColumns;
    const emptyComponent = () =>
      <div className="nuclide-debugger-thread-list-empty">
        {threadList == null ? '(threads unavailable)' : 'no threads to display'}
      </div>;
    const rows = threadList == null
      ? []
      : threadList.map((threadItem, i) => {
        const cellData = {
          data: {
            ...threadItem,
            isSelected: Number(threadItem.id) === selectedThreadId,
          },
        };
        if (Number(threadItem.id) === selectedThreadId) {
          // $FlowIssue className is an optional property of a table row
          cellData.className = 'nuclide-debugger-thread-list-item-selected';
        }
        return cellData;
      });
    return (
      <Table
        columns={columns}
        emptyComponent={emptyComponent}
        rows={rows}
        selectable={true}
        resizable={true}
        onSelect={this._handleSelectThread}
      />
    );
  }
}
