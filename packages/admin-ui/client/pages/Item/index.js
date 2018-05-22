import React, { Component, Fragment } from 'react';
import styled from 'react-emotion';
import gql from 'graphql-tag';
import { Mutation, Query } from 'react-apollo';
import { Link, withRouter } from 'react-router-dom';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import CreateItemModal from '../../components/CreateItemModal';
import DeleteItemModal from '../../components/DeleteItemModal';
import Nav from '../../components/Nav';
import PageLoading from '../../components/PageLoading';
import Footer from './Footer';
import {
  ArrowLeftIcon,
  CheckIcon,
  ClippyIcon,
  InfoIcon,
  PlusIcon,
} from '@keystonejs/icons';
import { Container, FlexGroup } from '@keystonejs/ui/src/primitives/layout';
import { A11yText, Title } from '@keystonejs/ui/src/primitives/typography';
import { Button, IconButton } from '@keystonejs/ui/src/primitives/buttons';
import { Dialog } from '@keystonejs/ui/src/primitives/modals';
import { Alert } from '@keystonejs/ui/src/primitives/alert';
import { colors, gridSize } from '@keystonejs/ui/src/theme';

import { resolveAllKeys } from '@keystonejs/utils';

// This import is loaded by the @keystone/field-views-loader loader.
// It imports all the views required for a keystone app by looking at the adminMetaData
import FieldTypes from '../../FIELD_TYPES';

const getItemQuery = ({ list, itemId }) => gql`
  {
    ${list.itemQueryName}(id: "${itemId}") {
      id
      _label_
      ${list.fields.map(field => field.getQueryFragment()).join(' ')}
    }
  }
`;

const ItemId = styled.div({
  color: colors.N30,
  fontFamily: 'Monaco, Consolas, monospace',
  fontSize: '0.85em',
});

const Form = styled.div({
  margin: '24px 0',
});

const FooterNavigation = styled.div(`
  margin-bottom: 24px;
`);

class ConfirmResetModal extends Component {
  onKeyDown = e => {
    if (e.key === 'Escape') {
      this.props.onCancel();
    }
  };
  render() {
    const { onCancel, onConfirm } = this.props;
    return (
      <Dialog isOpen onClose={onCancel} onKeyDown={this.onKeyDown} width={400}>
        <p style={{ marginTop: 0 }}>
          Are you sure you want reset your changes?
        </p>
        <footer>
          <Button appearance="danger" onClick={onConfirm}>
            Reset
          </Button>
          <Button variant="subtle" onClick={onCancel}>
            Cancel
          </Button>
        </footer>
      </Dialog>
    );
  }
}

// TODO: show updateInProgress and updateSuccessful / updateFailed UI

const ItemDetails = withRouter(
  class ItemDetails extends Component {
    state = {
      copyText: '',
      item: this.props.item,
      itemHasChanged: false,
      showCreateModal: false,
      showDeleteModal: false,
      showResetChangesModal: false,
    };
    componentDidMount() {
      this.mounted = true;
    }
    componentWillUnmount() {
      this.mounted = false;
    }
    showDeleteModal = () => {
      this.setState({ showDeleteModal: true });
    };
    closeDeleteModal = () => {
      this.setState({ showDeleteModal: false });
    };
    onDelete = () => {
      const { adminPath, history, list } = this.props;
      if (this.mounted) {
        this.setState({ showDeleteModal: false });
      }
      history.push(`${adminPath}/${list.path}`);
    };
    showConfirmResetModal = () => {
      const { itemHasChanged } = this.state;
      if (!itemHasChanged) return;
      this.setState({ showConfirmResetModal: true });
    };
    closeConfirmResetModal = () => {
      this.setState({ showConfirmResetModal: false });
    };
    onReset = () => {
      this.setState({
        item: this.props.item,
      });
      this.closeConfirmResetModal();
    };
    onChange = (field, value) => {
      const { item } = this.state;
      this.setState({
        item: {
          ...item,
          [field.path]: value,
        },
        itemHasChanged: true,
      });
    };
    renderConfirmResetModal() {
      const { showConfirmResetModal } = this.state;
      if (!showConfirmResetModal) return;

      return (
        <ConfirmResetModal
          onCancel={this.closeConfirmResetModal}
          onConfirm={this.onReset}
        />
      );
    }
    renderDeleteModal() {
      const { showDeleteModal } = this.state;
      const { item, list } = this.props;

      return (
        <DeleteItemModal
          isOpen={showDeleteModal}
          item={item}
          list={list}
          onClose={this.closeDeleteModal}
          onDelete={this.onDelete}
        />
      );
    }
    onSave = () => {
      const {
        item,
        item: { id },
      } = this.state;
      const {
        list: { fields },
        onUpdate,
        updateItem,
      } = this.props;
      resolveAllKeys(
        fields.reduce((values, field) => {
          values[field.path] = field.getValue(item);
          return values;
        }, {})
      )
        .then(data => updateItem({ variables: { id, data } }))
        .then(onUpdate);
    };
    onCopy = (text, success) => {
      if (success) {
        this.setState({ copyText: text }, () => {
          setTimeout(() => {
            this.setState({ copyText: '' });
          }, 500);
        });
      }
    };

    /**
     * Create item
     */
    openCreateModal = () => this.setState({ showCreateModal: true });
    closeCreateModal = () => this.setState({ showCreateModal: false });
    renderCreateModal = () =>
      this.state.showCreateModal ? (
        <CreateItemModal
          list={this.props.list}
          onClose={this.closeCreateModal}
          onCreate={this.onCreate}
        />
      ) : null;
    onCreate = ({ data }) => {
      const { list, adminPath, history } = this.props;
      const { id } = data[list.createMutationName];
      history.push(`${adminPath}/${list.path}/${id}`);
    };

    render() {
      const {
        adminPath,
        list,
        updateInProgress,
        updateErrorMessage,
      } = this.props;
      const { copyText, item, itemHasChanged } = this.state;
      const isCopied = copyText === item.id;
      const CopyIcon = isCopied ? CheckIcon : ClippyIcon;
      const listHref = `${adminPath}/${list.path}`;

      return (
        <Fragment>
          {updateErrorMessage ? (
            <Alert appearance="danger" css={{ marginTop: gridSize * 3 }}>
              {updateErrorMessage}
            </Alert>
          ) : null}
          <FlexGroup align="center" justify="space-between">
            <Title>
              <Link to={listHref}>{list.label}</Link>: {item.name}
            </Title>
            <IconButton
              appearance="create"
              icon={PlusIcon}
              onClick={this.openCreateModal}
            >
              Create
            </IconButton>
          </FlexGroup>
          <FlexGroup align="center" isContiguous>
            <ItemId>ID: {item.id}</ItemId>
            <CopyToClipboard text={item.id} onCopy={this.onCopy}>
              <Button variant="subtle" title="Copy ID">
                <CopyIcon
                  css={{ color: isCopied ? colors.create : 'inherit' }}
                />
                <A11yText>Copy ID</A11yText>
              </Button>
            </CopyToClipboard>
          </FlexGroup>
          <Form>
            {list.fields.map((field, i) => {
              const { Field } = FieldTypes[list.key][field.path];
              return (
                <Field
                  autoFocus={!i}
                  field={field}
                  item={item}
                  key={field.path}
                  onChange={this.onChange}
                />
              );
            })}
          </Form>

          <Footer
            onSave={this.onSave}
            onDelete={this.showDeleteModal}
            onReset={itemHasChanged ? this.showConfirmResetModal : undefined}
            updateInProgress={updateInProgress}
          />
          <FooterNavigation>
            <IconButton
              appearance="primary"
              icon={ArrowLeftIcon}
              to={listHref}
              variant="subtle"
              style={{ paddingLeft: 0 }}
            >
              Back to {list.label}
            </IconButton>
          </FooterNavigation>
          {this.renderCreateModal()}
          {this.renderDeleteModal()}
          {this.renderConfirmResetModal()}
        </Fragment>
      );
    }
  }
);

const NotFoundContainer = ({ children, ...props }) => (
  <div
    css={{
      alignItems: 'center',
      color: colors.N30,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '2em 1em',
      textAlign: 'center',
    }}
    {...props}
  >
    <InfoIcon css={{ height: 48, width: 48 }} />
    {children}
  </div>
);
const ItemNotFound = ({ itemId, list, adminPath }) => (
  <NotFoundContainer>
    <Title>{list.singular} Not Found</Title>
    <p>
      The item <code>{itemId}</code> does not exist.
    </p>
    <p>
      <Button
        variant="subtle"
        appearance="primary"
        to={`${adminPath}/${list.path}`}
      >
        Back to {list.label}
      </Button>
      {' • '}
      <Button variant="subtle" appearance="primary" to={adminPath}>
        Go Home
      </Button>
    </p>
  </NotFoundContainer>
);

const ItemPage = ({ list, itemId, adminPath, getListByKey }) => {
  const itemQuery = getItemQuery({ list, itemId });
  return (
    <Fragment>
      <Nav />
      <Container>
        <Query query={itemQuery}>
          {({ loading, error, data, refetch }) => {
            if (loading) return <PageLoading />;
            if (error) {
              return (
                <Fragment>
                  <Title>Error</Title>
                  <p>{error.message}</p>
                </Fragment>
              );
            }

            const item = data[list.itemQueryName];
            return item ? (
              <Mutation mutation={list.updateMutation}>
                {(
                  updateItem,
                  { loading: updateInProgress, error: updateError }
                ) => {
                  return (
                    <ItemDetails
                      adminPath={adminPath}
                      item={item}
                      key={itemId}
                      list={list}
                      getListByKey={getListByKey}
                      onUpdate={refetch}
                      updateInProgress={updateInProgress}
                      updateErrorMessage={updateError && updateError.message}
                      updateItem={updateItem}
                    />
                  );
                }}
              </Mutation>
            ) : (
              <ItemNotFound adminPath={adminPath} itemId={itemId} list={list} />
            );
          }}
        </Query>
      </Container>
    </Fragment>
  );
};

export default ItemPage;